/**
 * seedData.js
 * Comprehensive seed script to generate interconnected realistic business data.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Branch = require('../models/Branch');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const InventoryLog = require('../models/InventoryLog');
const { ROLE_IDS } = require('../utils/roles');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_db';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const seed = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Get Admin User
    const adminUser = await User.findOne({ role: ROLE_IDS.ADMIN }) || await User.findOne();
    if (!adminUser) {
      console.warn('⚠️ No users found in database. Run a script to create an admin first, or data will lack a creator.');
    }
    const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    // 2. Branches
    console.log('📂 Seeding Branches...');
    const branches = [
      { name: 'Main Branch', city: 'Tadepalligudem', state: 'Andhra Pradesh', address: '123 Main St' },
      { name: 'City Branch', city: 'Vijayawada', state: 'Andhra Pradesh', address: '456 City Center' }
    ];
    const branchMap = {};
    for (const b of branches) {
      const branch = await Branch.findOneAndUpdate({ name: b.name }, { $set: b }, { upsert: true, new: true, setDefaultsOnInsert: true });
      branchMap[b.name] = branch._id;
    }
    const mainBranchId = branchMap['Main Branch'];

    // 3. Categories
    console.log('📂 Seeding Categories...');
    const catData = [
      'Laptops', 'Mobile Phones', 'Computer Accessories', 'Monitors', 'Printers',
      'Networking', 'Storage Devices', 'Keyboards & Mice', 'Audio Devices', 'Cables & Adapters'
    ];
    const categoryMap = {};
    for (let i = 0; i < catData.length; i++) {
      const name = catData[i];
      const category = await Category.findOneAndUpdate(
        { name },
        { $set: { description: `${name} related items`, isActive: true, sortOrder: i+1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      categoryMap[name] = category._id;
    }

    // 4. Suppliers
    console.log('🏭 Seeding Suppliers...');
    const supData = [
      { companyName: 'TechSource Distributors', name: 'Ravi Kumar', email: 'contact@techsource.in', phone: '9876543210' },
      { companyName: 'Prime IT Solutions', name: 'Amit Singh', email: 'sales@primeit.in', phone: '9876543211' },
      { companyName: 'Digital World Suppliers', name: 'Neha Sharma', email: 'info@digitalworld.in', phone: '9876543212' },
      { companyName: 'Andhra Computer Mart', name: 'Srinivas Rao', email: 'orders@andhramart.in', phone: '9876543213' },
      { companyName: 'SmartTech Wholesale', name: 'Pooja Verma', email: 'wholesale@smarttech.in', phone: '9876543214' },
      { companyName: 'Vertex Electronics', name: 'Vikram Reddy', email: 'contact@vertex.in', phone: '9876543215' },
      { companyName: 'NextGen Systems', name: 'Anil Desai', email: 'sales@nextgen.in', phone: '9876543216' },
      { companyName: 'Reliable IT Distributors', name: 'Sunita Joshi', email: 'info@reliableit.in', phone: '9876543217' }
    ];
    const supplierMap = {};
    for (const s of supData) {
      const supplier = await Supplier.findOneAndUpdate(
        { email: s.email },
        { $set: { ...s, address: 'Industrial Area', city: 'Hyderabad', state: 'Telangana', country: 'India', isActive: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      supplierMap[s.companyName] = supplier._id;
    }

    // 5. Products
    console.log('📦 Seeding Products...');
    const productList = [
      // Laptops
      { name: 'Dell Inspiron 15', sku: 'LAP-DELL-001', cat: 'Laptops', sup: 'TechSource Distributors', pp: 48000, sp: 55000, qty: 40, min: 10 },
      { name: 'HP 15s', sku: 'LAP-HP-002', cat: 'Laptops', sup: 'Prime IT Solutions', pp: 42000, sp: 49000, qty: 15, min: 10 }, // Medium
      { name: 'Lenovo IdeaPad Slim 3', sku: 'LAP-LEN-003', cat: 'Laptops', sup: 'Digital World Suppliers', pp: 35000, sp: 42000, qty: 5, min: 10 }, // Low
      { name: 'ASUS VivoBook 15', sku: 'LAP-ASUS-004', cat: 'Laptops', sup: 'Andhra Computer Mart', pp: 40000, sp: 47000, qty: 0, min: 5 }, // Out
      { name: 'Acer Aspire 5', sku: 'LAP-ACER-005', cat: 'Laptops', sup: 'SmartTech Wholesale', pp: 38000, sp: 45000, qty: 25, min: 10 },
      
      // Mobile Phones
      { name: 'Samsung Galaxy A15', sku: 'MOB-SAM-001', cat: 'Mobile Phones', sup: 'Vertex Electronics', pp: 15000, sp: 18000, qty: 50, min: 15 },
      { name: 'Redmi Note 13', sku: 'MOB-RED-002', cat: 'Mobile Phones', sup: 'NextGen Systems', pp: 14000, sp: 17000, qty: 12, min: 15 }, // Low
      { name: 'Realme 12', sku: 'MOB-REAL-003', cat: 'Mobile Phones', sup: 'Reliable IT Distributors', pp: 16000, sp: 19500, qty: 30, min: 10 },
      { name: 'OnePlus Nord CE', sku: 'MOB-ONE-004', cat: 'Mobile Phones', sup: 'TechSource Distributors', pp: 22000, sp: 25000, qty: 0, min: 10 }, // Out
      { name: 'Motorola G54', sku: 'MOB-MOT-005', cat: 'Mobile Phones', sup: 'Prime IT Solutions', pp: 13000, sp: 16000, qty: 22, min: 10 },

      // Monitors
      { name: 'Dell 24-inch Monitor', sku: 'MON-DELL-001', cat: 'Monitors', sup: 'Digital World Suppliers', pp: 9000, sp: 11000, qty: 18, min: 5 },
      { name: 'LG 24-inch IPS Monitor', sku: 'MON-LG-002', cat: 'Monitors', sup: 'Andhra Computer Mart', pp: 9500, sp: 11500, qty: 4, min: 10 }, // Low
      { name: 'Samsung 27-inch Monitor', sku: 'MON-SAM-003', cat: 'Monitors', sup: 'SmartTech Wholesale', pp: 13000, sp: 16000, qty: 20, min: 5 },
      { name: 'Acer 24-inch Monitor', sku: 'MON-ACER-004', cat: 'Monitors', sup: 'Vertex Electronics', pp: 8000, sp: 10000, qty: 0, min: 5 }, // Out

      // Accessories
      { name: 'Logitech Wireless Mouse', sku: 'ACC-LOG-001', cat: 'Keyboards & Mice', sup: 'NextGen Systems', pp: 600, sp: 900, qty: 100, min: 20 },
      { name: 'HP Wireless Keyboard', sku: 'ACC-HP-002', cat: 'Keyboards & Mice', sup: 'Reliable IT Distributors', pp: 1200, sp: 1600, qty: 45, min: 15 },
      { name: 'Dell USB Keyboard', sku: 'ACC-DELL-003', cat: 'Keyboards & Mice', sup: 'TechSource Distributors', pp: 500, sp: 750, qty: 15, min: 20 }, // Low
      { name: 'Logitech MK270', sku: 'ACC-LOG-004', cat: 'Keyboards & Mice', sup: 'Prime IT Solutions', pp: 1500, sp: 2000, qty: 0, min: 10 }, // Out
      { name: 'USB-C Hub', sku: 'ACC-HUB-005', cat: 'Cables & Adapters', sup: 'Digital World Suppliers', pp: 800, sp: 1200, qty: 35, min: 10 },
      { name: 'HDMI Cable', sku: 'ACC-HDMI-006', cat: 'Cables & Adapters', sup: 'Andhra Computer Mart', pp: 150, sp: 300, qty: 150, min: 30 },
      { name: 'Ethernet Cable', sku: 'ACC-ETH-007', cat: 'Cables & Adapters', sup: 'SmartTech Wholesale', pp: 100, sp: 200, qty: 200, min: 40 },

      // Storage
      { name: 'Samsung 500GB SSD', sku: 'STO-SAM-001', cat: 'Storage Devices', sup: 'Vertex Electronics', pp: 3500, sp: 4500, qty: 40, min: 10 },
      { name: 'WD 1TB HDD', sku: 'STO-WD-002', cat: 'Storage Devices', sup: 'NextGen Systems', pp: 3000, sp: 4000, qty: 8, min: 10 }, // Low
      { name: 'SanDisk 128GB USB Drive', sku: 'STO-SAN-003', cat: 'Storage Devices', sup: 'Reliable IT Distributors', pp: 800, sp: 1100, qty: 80, min: 20 },
      { name: 'Kingston 256GB SSD', sku: 'STO-KIN-004', cat: 'Storage Devices', sup: 'TechSource Distributors', pp: 2200, sp: 3000, qty: 0, min: 5 }, // Out

      // Networking
      { name: 'TP-Link WiFi Router', sku: 'NET-TPL-001', cat: 'Networking', sup: 'Prime IT Solutions', pp: 1200, sp: 1800, qty: 3, min: 10 }, // Low
      { name: 'D-Link Router', sku: 'NET-DL-002', cat: 'Networking', sup: 'Digital World Suppliers', pp: 1100, sp: 1700, qty: 25, min: 10 },
      { name: 'TP-Link 8-Port Switch', sku: 'NET-TPL-003', cat: 'Networking', sup: 'Andhra Computer Mart', pp: 800, sp: 1200, qty: 0, min: 5 }, // Out
      { name: 'D-Link 16-Port Switch', sku: 'NET-DL-004', cat: 'Networking', sup: 'SmartTech Wholesale', pp: 1500, sp: 2200, qty: 12, min: 5 },

      // Printers
      { name: 'HP LaserJet Printer', sku: 'PRI-HP-001', cat: 'Printers', sup: 'Vertex Electronics', pp: 12000, sp: 15000, qty: 15, min: 5 },
      { name: 'Canon Inkjet Printer', sku: 'PRI-CAN-002', cat: 'Printers', sup: 'NextGen Systems', pp: 8000, sp: 10000, qty: 4, min: 5 }, // Low
      { name: 'Epson EcoTank Printer', sku: 'PRI-EPS-003', cat: 'Printers', sup: 'Reliable IT Distributors', pp: 14000, sp: 17500, qty: 0, min: 3 }, // Out
    ];

    const prodMap = {};
    for (const p of productList) {
      const product = await Product.findOneAndUpdate(
        { sku: p.sku },
        { $set: {
          name: p.name,
          category: categoryMap[p.cat],
          supplier: supplierMap[p.sup],
          purchasePrice: p.pp,
          sellingPrice: p.sp,
          price: p.sp, // backward compat
          costPrice: p.pp, // backward compat
          quantity: p.qty,
          minimumStock: p.min,
          reorderLevel: p.min, // backward compat
          unit: 'piece',
          description: `High quality ${p.name}`,
          isActive: true
        }},
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      prodMap[p.sku] = product;
    }

    // 6. Customers
    console.log('👥 Seeding Customers...');
    const custNames = [
      'Rahul Verma', 'Sneha Reddy', 'Amit Patel', 'Neha Gupta', 'Vikram Singh',
      'Pooja Sharma', 'Anil Kumar', 'Sunita Desai', 'Ravi Teja', 'Kavya Iyer',
      'Suresh Babu', 'Divya Menon', 'Rajesh Khanna', 'Meera Nair', 'Vijay M',
      'Swati Jain', 'Karthik S', 'Anjali P', 'Manoj T', 'Shruti R'
    ];
    const customerMap = {};
    for (let i = 0; i < 25; i++) {
      const name = custNames[i % custNames.length] + (i >= custNames.length ? ` ${i}` : '');
      const email = `customer${i}@example.com`;
      const customer = await Customer.findOneAndUpdate(
        { email },
        { $set: {
          name,
          email,
          phone: `99887766${String(i).padStart(2, '0')}`,
          address: 'Main Road',
          city: 'Vijayawada',
          state: 'Andhra Pradesh',
          customerType: randomItem(['retail', 'wholesale', 'corporate']),
          isActive: true
        }},
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      customerMap[email] = customer._id;
    }
    const customerList = Object.values(customerMap);

    // 7. Purchases
    console.log('🛒 Seeding Purchases...');
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const prods = Object.values(prodMap);
    
    // Clear old seeded purchases/sales/logs for a clean recent history slate
    await Purchase.deleteMany({ notes: 'Seeded Data' });
    await Sale.deleteMany({ notes: 'Seeded Data' });
    
    for (let i = 1; i <= 30; i++) {
      const pCount = randomInt(1, 4);
      const items = [];
      let subtotal = 0;
      const supplierId = randomItem(Object.values(supplierMap));
      
      for (let j = 0; j < pCount; j++) {
        const prod = randomItem(prods);
        const qty = randomInt(5, 50);
        const st = qty * prod.purchasePrice;
        items.push({
          product: prod._id,
          quantity: qty,
          purchasePrice: prod.purchasePrice,
          subtotal: st
        });
        subtotal += st;
      }
      
      const purchaseDate = randomDate(threeMonthsAgo, now);
      
      const purchase = await Purchase.create({
        purchaseNumber: `PUR-SEED-${i.toString().padStart(4, '0')}`,
        supplier: supplierId,
        items,
        subtotal,
        totalAmount: subtotal,
        purchaseDate,
        status: 'delivered',
        paymentStatus: 'completed',
        branch: mainBranchId,
        createdBy: adminId,
        notes: 'Seeded Data',
        createdAt: purchaseDate
      });

      // Inventory Logs for Purchase
      for (const item of items) {
        await InventoryLog.create({
          product: item.product,
          user: adminId,
          type: 'stock_in',
          quantity: item.quantity,
          previousStock: 0,
          newStock: item.quantity,
          referenceId: purchase._id,
          referenceType: 'Purchase',
          notes: 'Seeded Purchase',
          createdAt: purchaseDate
        });
      }
    }

    // 8. Sales
    console.log('📈 Seeding Sales...');
    for (let i = 1; i <= 40; i++) {
      const sCount = randomInt(1, 3);
      const items = [];
      let subtotal = 0;
      const customerId = randomItem(customerList);
      
      for (let j = 0; j < sCount; j++) {
        const prod = randomItem(prods);
        const qty = randomInt(1, 5);
        const st = qty * prod.sellingPrice;
        items.push({
          product: prod._id,
          quantity: qty,
          price: prod.sellingPrice,
          subtotal: st
        });
        subtotal += st;
      }
      
      const saleDate = randomDate(threeMonthsAgo, now);
      
      const sale = await Sale.create({
        saleNumber: `INV-SEED-${i.toString().padStart(4, '0')}`,
        customer: customerId,
        items,
        subtotal,
        totalAmount: subtotal,
        paymentMethod: randomItem(['cash', 'card', 'upi']),
        paymentStatus: 'completed',
        branch: mainBranchId,
        createdBy: adminId,
        notes: 'Seeded Data',
        createdAt: saleDate
      });

      // Inventory Logs for Sale
      for (const item of items) {
        await InventoryLog.create({
          product: item.product,
          user: adminId,
          type: 'stock_out',
          quantity: item.quantity,
          previousStock: item.quantity + 5, // Just mock values
          newStock: 5,
          referenceId: sale._id,
          referenceType: 'Sale',
          notes: 'Seeded Sale',
          createdAt: saleDate
        });
      }
    }

    // 9. Activity Logs
    console.log('📝 Seeding Activity Logs...');
    await ActivityLog.deleteMany({ browser: 'Seeder' });
    
    for (let i = 0; i < 20; i++) {
      const actionDate = randomDate(threeMonthsAgo, now);
      const modules = ['products', 'suppliers', 'customers', 'sales', 'purchases'];
      const actions = ['Created', 'Updated', 'Viewed', 'Deleted'];
      
      await ActivityLog.create({
        user: adminId,
        action: `${randomItem(actions)} a record`,
        module: randomItem(modules),
        ipAddress: '127.0.0.1',
        device: 'Desktop',
        browser: 'Seeder',
        status: 'success',
        createdAt: actionDate
      });
    }

    console.log('✅ Seeding completed successfully!');
    
    // Reports
    const catCount = await Category.countDocuments();
    const supCount = await Supplier.countDocuments();
    const prodCount = await Product.countDocuments();
    const custCount = await Customer.countDocuments();
    const purCount = await Purchase.countDocuments({ notes: 'Seeded Data' });
    const saleCount = await Sale.countDocuments({ notes: 'Seeded Data' });
    
    console.log('\n--- Seed Summary ---');
    console.log(`Categories: ${catCount}`);
    console.log(`Suppliers: ${supCount}`);
    console.log(`Products: ${prodCount}`);
    console.log(`Customers: ${custCount}`);
    console.log(`Purchases: ${purCount}`);
    console.log(`Sales: ${saleCount}`);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
};

seed();
