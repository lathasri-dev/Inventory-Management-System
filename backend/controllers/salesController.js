const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const InventoryLog = require('../models/InventoryLog');

const generateSaleNumber = () => `SAL-${Date.now()}`;
const generateInvoiceNumber = () => `INV-${Date.now()}`;

const logSaleActivity = async (req, action, sale) => {
  if (!req.user) return;

  await ActivityLog.create({
    user: req.user.id,
    action,
    module: 'sales',
    resourceId: sale._id,
    resourceType: 'Sale',
    changes: { after: sale },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    status: 'success',
  });
};

exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find({ isActive: true })
      .populate('customer', 'name email phone')
      .populate('items.product', 'name sku price')
      .sort({ createdAt: -1 });

    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

    res.json({ success: true, data: { sales, totalRevenue } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name sku price');

    if (!sale || !sale.isActive) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.createSale = async (req, res) => {
  let session = null;
  let useTransaction = true;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    useTransaction = false;
    if (session) {
      session.endSession();
      session = null;
    }
  }

  const executeSale = async (opts = {}) => {
    const { customer, items, tax = 0, discount = 0, paymentMethod = 'cash', paymentStatus = 'completed', notes = '' } = req.body;

    if (!customer || !Array.isArray(items) || items.length === 0) {
      throw new Error('Customer and sale items are required');
    }

    const customerDoc = opts.session 
      ? await Customer.findById(customer).session(opts.session)
      : await Customer.findById(customer);

    if (!customerDoc || !customerDoc.isActive) {
      throw new Error('Customer not found or inactive');
    }

    let subtotal = 0;
    const saleItems = [];
    const logsToCreate = [];

    for (const item of items) {
      const product = opts.session
        ? await Product.findById(item.product).session(opts.session)
        : await Product.findById(item.product);

      if (!product || !product.isActive) {
        throw new Error(`Product not found for item ${item.product}`);
      }

      const quantity = Number(item.quantity) || 0;
      if (quantity <= 0 || product.quantity < quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const price = Number(item.price ?? product.price) || 0;
      const itemDiscount = Number(item.discount) || 0;
      const itemSubtotal = quantity * price - itemDiscount;
      subtotal += itemSubtotal;

      const previousStock = product.quantity;
      product.quantity -= quantity;

      // Update product stock status
      if (product.quantity === 0) {
        product.status = 'out_of_stock';
      } else if (product.quantity <= product.reorderLevel) {
        product.status = 'low_stock';
      } else {
        product.status = 'active';
      }

      if (opts.session) {
        await product.save({ session: opts.session });
      } else {
        await product.save();
      }

      saleItems.push({
        product: product._id,
        quantity,
        price,
        discount: itemDiscount,
        subtotal: itemSubtotal,
      });

      logsToCreate.push({
        product: product._id,
        type: 'stock_out',
        quantity: -quantity,
        previousStock,
        newStock: product.quantity,
      });
    }

    const totalAmount = subtotal + Number(tax) - Number(discount);
    
    let createdSale;
    if (opts.session) {
      const sale = await Sale.create([
        {
          saleNumber: generateSaleNumber(),
          customer: customerDoc._id,
          items: saleItems,
          subtotal,
          tax,
          discount,
          totalAmount,
          paymentMethod,
          paymentStatus,
          notes,
          branch: req.user?.branch || undefined,
        },
      ], { session: opts.session });
      createdSale = sale[0];
    } else {
      createdSale = await Sale.create({
        saleNumber: generateSaleNumber(),
        customer: customerDoc._id,
        items: saleItems,
        subtotal,
        tax,
        discount,
        totalAmount,
        paymentMethod,
        paymentStatus,
        notes,
        branch: req.user?.branch || undefined,
      });
    }

    if (opts.session) {
      await Invoice.create([
        {
          invoiceNumber: generateInvoiceNumber(),
          sale: createdSale._id,
          customer: customerDoc._id,
          items: saleItems.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            price: item.price,
            total: item.subtotal,
          })),
          subtotal,
          tax,
          discount,
          totalAmount,
          paymentStatus: paymentStatus === 'completed' ? 'paid' : 'unpaid',
        },
      ], { session: opts.session });
    } else {
      await Invoice.create({
        invoiceNumber: generateInvoiceNumber(),
        sale: createdSale._id,
        customer: customerDoc._id,
        items: saleItems.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          total: item.subtotal,
        })),
        subtotal,
        tax,
        discount,
        totalAmount,
        paymentStatus: paymentStatus === 'completed' ? 'paid' : 'unpaid',
      });
    }

    // Track outstanding payments
    if (paymentStatus === 'pending' || paymentStatus === 'failed') {
      customerDoc.outstandingPayments = (customerDoc.outstandingPayments || 0) + totalAmount;
    }

    customerDoc.totalPurchases += 1;
    customerDoc.totalSpent += totalAmount;
    
    if (opts.session) {
      await customerDoc.save({ session: opts.session });
    } else {
      await customerDoc.save();
    }

    // Save inventory logs linked to this sale
    for (const log of logsToCreate) {
      log.user = req.user.id;
      log.referenceId = createdSale._id;
      log.referenceType = 'Sale';
      log.notes = `Sold via sale order ${createdSale.saleNumber}`;
    }
    
    if (opts.session) {
      await InventoryLog.insertMany(logsToCreate, { session: opts.session });
    } else {
      await InventoryLog.insertMany(logsToCreate);
    }

    if (opts.session) {
      await Notification.create([
        {
          user: req.user.id,
          type: 'order',
          title: 'New Sale Recorded',
          message: `Sale ${createdSale.saleNumber} has been created successfully.`,
          relatedData: { orderId: createdSale._id },
          link: '/sales',
        },
      ], { session: opts.session });
    } else {
      await Notification.create({
        user: req.user.id,
        type: 'order',
        title: 'New Sale Recorded',
        message: `Sale ${createdSale.saleNumber} has been created successfully.`,
        relatedData: { orderId: createdSale._id },
        link: '/sales',
      });
    }

    return createdSale;
  };

  if (useTransaction && session) {
    try {
      const createdSale = await executeSale({ session });
      await session.commitTransaction();
      await logSaleActivity(req, 'CREATE_SALE', createdSale);

      const populated = await Sale.findById(createdSale._id)
        .populate('customer', 'name email phone')
        .populate('items.product', 'name sku price');

      return res.status(201).json({ success: true, data: populated });
    } catch (err) {
      await session.abortTransaction();
      const isTxError = err.message.includes('transaction') || 
                        err.message.includes('replica set') || 
                        err.codeName === 'TransactionOutcomeUnknown' || 
                        err.message.includes('does not support transactions');
      if (isTxError) {
        console.warn('MongoDB Transactions not supported, falling back to non-transaction execution.');
      } else {
        return res.status(400).json({ success: false, message: err.message });
      }
    } finally {
      session.endSession();
    }
  }

  // Fallback to non-transaction execution
  try {
    const createdSale = await executeSale();
    await logSaleActivity(req, 'CREATE_SALE', createdSale);

    const populated = await Sale.findById(createdSale._id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name sku price');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale || !sale.isActive) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    sale.isActive = false;
    await sale.save();
    res.json({ success: true, message: 'Sale deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
