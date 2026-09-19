const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const InventoryLog = require('../models/InventoryLog');

const generatePurchaseNumber = () => `PUR-${Date.now()}`;

exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('supplier', 'name companyName email').populate('items.product', 'name sku').sort({ createdAt: -1 });
    res.json({ success: true, data: purchases });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.createPurchase = async (req, res) => {
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

  const executePurchase = async (opts = {}) => {
    const { supplier, items, tax = 0, freight = 0, paymentStatus = 'pending', status = 'ordered', notes = '' } = req.body;

    if (!supplier || !Array.isArray(items) || items.length === 0) {
      throw new Error('Supplier and items are required');
    }

    const supplierDoc = opts.session 
      ? await Supplier.findById(supplier).session(opts.session)
      : await Supplier.findById(supplier);

    if (!supplierDoc || !supplierDoc.isActive) {
      throw new Error('Supplier not found or inactive');
    }

    let subtotal = 0;
    const purchaseItems = [];
    const logsToCreate = [];

    for (const item of items) {
      const product = opts.session
        ? await Product.findById(item.product).session(opts.session)
        : await Product.findById(item.product);

      if (!product || !product.isActive) {
        throw new Error(`Product not found for item ${item.product}`);
      }

      const quantity = Number(item.quantity) || 0;
      const purchasePrice = Number(item.purchasePrice) || Number(product.costPrice || product.price || 0);
      const itemSubtotal = quantity * purchasePrice;
      subtotal += itemSubtotal;

      const previousStock = product.quantity;
      product.quantity += quantity;
      product.costPrice = purchasePrice;
      product.purchasePrice = purchasePrice; // Align with schema

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

      purchaseItems.push({
        product: product._id,
        quantity,
        purchasePrice,
        subtotal: itemSubtotal,
      });

      logsToCreate.push({
        product: product._id,
        type: 'stock_in',
        quantity,
        previousStock,
        newStock: product.quantity,
      });
    }

    const totalAmount = subtotal + Number(tax) + Number(freight);
    
    let createdPurchase;
    if (opts.session) {
      const purchase = await Purchase.create([
        {
          purchaseNumber: generatePurchaseNumber(),
          supplier: supplierDoc._id,
          items: purchaseItems,
          subtotal,
          tax,
          freight,
          totalAmount,
          paymentStatus,
          status,
          notes,
          branch: req.user?.branch || undefined,
          createdBy: req.user.id,
        },
      ], { session: opts.session });
      createdPurchase = purchase[0];
    } else {
      createdPurchase = await Purchase.create({
        purchaseNumber: generatePurchaseNumber(),
        supplier: supplierDoc._id,
        items: purchaseItems,
        subtotal,
        tax,
        freight,
        totalAmount,
        paymentStatus,
        status,
        notes,
        branch: req.user?.branch || undefined,
        createdBy: req.user.id,
      });
    }

    // Manage outstanding payments for supplier
    if (paymentStatus === 'pending' || paymentStatus === 'partial') {
      supplierDoc.outstandingPayments = (supplierDoc.outstandingPayments || 0) + totalAmount;
    }

    supplierDoc.products = Array.from(new Set([...(supplierDoc.products || []).map(String), ...purchaseItems.map((item) => String(item.product))]));
    
    if (opts.session) {
      await supplierDoc.save({ session: opts.session });
    } else {
      await supplierDoc.save();
    }

    // Save inventory logs linked to this purchase
    for (const log of logsToCreate) {
      log.user = req.user.id;
      log.referenceId = createdPurchase._id;
      log.referenceType = 'Purchase';
      log.notes = `Purchased from supplier via PO ${createdPurchase.purchaseNumber}`;
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
          type: 'purchase',
          title: 'Purchase Created',
          message: `Purchase ${createdPurchase.purchaseNumber} has been recorded.`,
          relatedData: { purchaseId: createdPurchase._id },
          link: '/purchases',
        },
      ], { session: opts.session });
    } else {
      await Notification.create({
        user: req.user.id,
        type: 'purchase',
        title: 'Purchase Created',
        message: `Purchase ${createdPurchase.purchaseNumber} has been recorded.`,
        relatedData: { purchaseId: createdPurchase._id },
        link: '/purchases',
      });
    }

    if (opts.session) {
      await ActivityLog.create([
        {
          user: req.user.id,
          action: 'CREATE_PURCHASE',
          module: 'purchases',
          resourceId: createdPurchase._id,
          resourceType: 'Purchase',
          changes: { after: createdPurchase },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'success',
        },
      ], { session: opts.session });
    } else {
      await ActivityLog.create({
        user: req.user.id,
        action: 'CREATE_PURCHASE',
        module: 'purchases',
        resourceId: createdPurchase._id,
        resourceType: 'Purchase',
        changes: { after: createdPurchase },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });
    }

    return createdPurchase;
  };

  if (useTransaction && session) {
    try {
      const createdPurchase = await executePurchase({ session });
      await session.commitTransaction();

      const populated = await Purchase.findById(createdPurchase._id).populate('supplier', 'name companyName email').populate('items.product', 'name sku');
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
    const createdPurchase = await executePurchase();
    const populated = await Purchase.findById(createdPurchase._id).populate('supplier', 'name companyName email').populate('items.product', 'name sku');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
