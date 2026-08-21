const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

const buildCustomerQuery = (search, customerType) => {
  const query = { isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { gstNumber: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  if (customerType && customerType !== 'all') {
    query.customerType = customerType;
  }

  return query;
};

// ─── GET ALL CUSTOMERS ────────────────────────────────────────────────────────
exports.getCustomers = async (req, res) => {
  try {
    const { search = '', customerType, page, limit } = req.query;
    const query = buildCustomerQuery(search, customerType);

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const skip = (pageNum - 1) * limitNum;

      const total = await Customer.countDocuments(query);
      const customers = await Customer.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({
        success: true,
        data: customers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    const customers = await Customer.find(query).sort({ name: 1 });
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── GET CUSTOMER BY ID ───────────────────────────────────────────────────────
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer || !customer.isActive) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── GET CUSTOMER SALES HISTORY ───────────────────────────────────────────────
exports.getCustomerSales = async (req, res) => {
  try {
    const sales = await Sale.find({ customer: req.params.id, isActive: true })
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── CREATE CUSTOMER ──────────────────────────────────────────────────────────
exports.createCustomer = async (req, res) => {
  try {
    const {
      name, companyName, customerType, email, phone, alternatePhone, website,
      address, city, state, country, pincode, gstNumber, panNumber,
      creditLimit, creditPeriod, loyaltyPoints, notes,
    } = req.body;

    // Required field validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Address is required' });
    }

    // Email uniqueness check
    const existing = await Customer.findOne({ email: email.trim().toLowerCase(), isActive: true });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A customer with this email already exists' });
    }

    const customer = new Customer({
      name: name.trim(),
      companyName: companyName || '',
      customerType: customerType || 'retail',
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      alternatePhone: alternatePhone || '',
      website: website || '',
      address: address.trim(),
      city: city || '',
      state: state || '',
      country: country || 'India',
      pincode: pincode || '',
      gstNumber: gstNumber || '',
      panNumber: panNumber || '',
      creditLimit: parseFloat(creditLimit) || 0,
      creditPeriod: parseInt(creditPeriod, 10) || 0,
      loyaltyPoints: parseInt(loyaltyPoints, 10) || 0,
      notes: notes || '',
    });
    await customer.save();

    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── UPDATE CUSTOMER ──────────────────────────────────────────────────────────
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer || !customer.isActive) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const updates = req.body;

    // Validate email format if updating
    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Check email uniqueness on update
    if (updates.email && updates.email.toLowerCase() !== customer.email) {
      const dupEmail = await Customer.findOne({
        email: updates.email.trim().toLowerCase(),
        _id: { $ne: customer._id },
        isActive: true,
      });
      if (dupEmail) {
        return res.status(400).json({ success: false, message: 'A customer with this email already exists' });
      }
      updates.email = updates.email.trim().toLowerCase();
    }

    // Parse numeric fields
    if (updates.creditLimit !== undefined) updates.creditLimit = parseFloat(updates.creditLimit) || 0;
    if (updates.creditPeriod !== undefined) updates.creditPeriod = parseInt(updates.creditPeriod, 10) || 0;
    if (updates.loyaltyPoints !== undefined) updates.loyaltyPoints = parseInt(updates.loyaltyPoints, 10) || 0;

    Object.assign(customer, updates);
    await customer.save();

    res.json({ success: true, data: customer });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── DELETE CUSTOMER ──────────────────────────────────────────────────────────
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer || !customer.isActive) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.isActive = false;
    await customer.save();

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};