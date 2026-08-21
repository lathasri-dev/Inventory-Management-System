const Supplier = require('../models/Supplier');

const buildSupplierQuery = (search) => {
  const query = { isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { contactPerson: { $regex: search, $options: 'i' } },
      { gstNumber: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { businessType: { $regex: search, $options: 'i' } },
    ];
  }

  return query;
};

// ─── GET ALL SUPPLIERS ───────────────────────────────────────────────────────
exports.getSuppliers = async (req, res) => {
  try {
    const { search = '', page, limit, businessType } = req.query;
    const query = buildSupplierQuery(search);

    if (businessType && businessType !== 'all') {
      query.businessType = businessType;
    }

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const skip = (pageNum - 1) * limitNum;

      const total = await Supplier.countDocuments(query);
      const suppliers = await Supplier.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({
        success: true,
        data: suppliers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    const suppliers = await Supplier.find(query).sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── GET SUPPLIER BY ID ───────────────────────────────────────────────────────
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).populate('products', 'name sku price quantity');

    if (!supplier || !supplier.isActive) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, data: supplier });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── GET PRODUCTS FOR SUPPLIER ────────────────────────────────────────────────
exports.getSupplierProducts = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || !supplier.isActive) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const Product = require('../models/Product');
    const products = await Product.find({ supplier: req.params.id, isActive: true })
      .populate('category', 'name')
      .sort({ name: 1 });

    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── CREATE SUPPLIER ──────────────────────────────────────────────────────────
exports.createSupplier = async (req, res) => {
  try {
    const {
      name, companyName, businessType, email, phone, alternatePhone,
      website, contactPerson, address, city, state, country, pincode,
      gstNumber, panNumber, paymentTerms, creditLimit,
      bankDetails, notes, rating,
    } = req.body;

    // Required field validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
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

    // Check GST uniqueness only if provided and non-empty
    const cleanGst = gstNumber && gstNumber.trim() ? gstNumber.trim() : null;
    if (cleanGst) {
      const existGst = await Supplier.findOne({ gstNumber: cleanGst, isActive: true });
      if (existGst) {
        return res.status(400).json({ success: false, message: 'A supplier with this GST number already exists' });
      }
    }

    // Check email uniqueness
    const existEmail = await Supplier.findOne({ email: email.trim().toLowerCase(), isActive: true });
    if (existEmail) {
      return res.status(400).json({ success: false, message: 'A supplier with this email already exists' });
    }

    const supplierData = {
      name: name.trim(),
      companyName: companyName || '',
      businessType: businessType || 'manufacturer',
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      alternatePhone: alternatePhone || '',
      website: website || '',
      contactPerson: contactPerson || '',
      address: address.trim(),
      city: city || '',
      state: state || '',
      country: country || 'India',
      pincode: pincode || '',
      panNumber: panNumber || '',
      paymentTerms: paymentTerms || 'net_30',
      creditLimit: parseFloat(creditLimit) || 0,
      bankDetails: {
        bankName: bankDetails?.bankName || '',
        accountNumber: bankDetails?.accountNumber || '',
        ifscCode: bankDetails?.ifscCode || '',
        branchName: bankDetails?.branchName || '',
      },
      notes: notes || '',
      rating: parseFloat(rating) || 0,
    };

    // Only set gstNumber if provided (sparse unique index handles null)
    if (cleanGst) {
      supplierData.gstNumber = cleanGst;
    }

    const supplier = new Supplier(supplierData);
    await supplier.save();
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A supplier with this email or GST number already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── UPDATE SUPPLIER ──────────────────────────────────────────────────────────
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier || !supplier.isActive) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const updates = req.body;

    // Validate email format if updating
    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Check GST uniqueness on update (only if non-empty)
    if (updates.gstNumber !== undefined) {
      const cleanGst = updates.gstNumber && updates.gstNumber.trim() ? updates.gstNumber.trim() : null;
      if (cleanGst && cleanGst !== supplier.gstNumber) {
        const duplicate = await Supplier.findOne({
          gstNumber: cleanGst,
          _id: { $ne: supplier._id },
          isActive: true,
        });
        if (duplicate) {
          return res.status(400).json({ success: false, message: 'A supplier with this GST number already exists' });
        }
      }
      // Set to undefined (not stored) if blank, or the clean value
      updates.gstNumber = cleanGst || undefined;
    }

    // Check email uniqueness on update
    if (updates.email && updates.email.toLowerCase() !== supplier.email) {
      const dupEmail = await Supplier.findOne({
        email: updates.email.trim().toLowerCase(),
        _id: { $ne: supplier._id },
        isActive: true,
      });
      if (dupEmail) {
        return res.status(400).json({ success: false, message: 'A supplier with this email already exists' });
      }
      updates.email = updates.email.trim().toLowerCase();
    }

    // Handle numeric fields
    if (updates.creditLimit !== undefined) updates.creditLimit = parseFloat(updates.creditLimit) || 0;
    if (updates.rating !== undefined) updates.rating = parseFloat(updates.rating) || 0;

    // Handle nested bankDetails
    if (updates.bankDetails && typeof updates.bankDetails === 'object') {
      supplier.bankDetails = {
        bankName: updates.bankDetails.bankName || supplier.bankDetails?.bankName || '',
        accountNumber: updates.bankDetails.accountNumber || supplier.bankDetails?.accountNumber || '',
        ifscCode: updates.bankDetails.ifscCode || supplier.bankDetails?.ifscCode || '',
        branchName: updates.bankDetails.branchName || supplier.bankDetails?.branchName || '',
      };
      delete updates.bankDetails;
    }

    Object.assign(supplier, updates);
    await supplier.save();

    res.json({ success: true, data: supplier });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A supplier with this email or GST number already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── DELETE SUPPLIER ──────────────────────────────────────────────────────────
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier || !supplier.isActive) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Soft delete
    supplier.isActive = false;
    await supplier.save();

    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
