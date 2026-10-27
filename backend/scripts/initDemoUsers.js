const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const { ROLE_IDS } = require('../utils/roles');

const MONGO_URI = process.env.MONGO_URI;

const demoUsers = [
  {
    fullName: 'System Administrator',
    email: 'admin@inventory.com',
    password: 'Password123!',
    phone: '9876543210',
    role: ROLE_IDS.ADMIN,
    securityQuestion: 'What was the name of your first school?',
    securityAnswer: 'school',
    isEmailVerified: true,
  },
  {
    fullName: 'Store Manager',
    email: 'manager@inventory.com',
    password: 'Password123!',
    phone: '9876543211',
    role: ROLE_IDS.MANAGER,
    securityQuestion: 'What was the name of your first school?',
    securityAnswer: 'school',
    isEmailVerified: true,
  },
  {
    fullName: 'Inventory Staff',
    email: 'user@inventory.com',
    password: 'Password123!',
    phone: '9876543212',
    role: ROLE_IDS.USER,
    securityQuestion: 'What was the name of your first school?',
    securityAnswer: 'school',
    isEmailVerified: true,
  },
  {
    fullName: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin@123',
    phone: '1234567890',
    role: ROLE_IDS.ADMIN,
    securityQuestion: 'What was the name of your first school?',
    securityAnswer: 'school',
    isEmailVerified: true,
  },
];

async function initDemoUsers() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    let adminId = null;

    for (const u of demoUsers) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        const securityAnswerHash = await bcrypt.hash(u.securityAnswer.toLowerCase(), 12);
        const newUser = new User({
          fullName: u.fullName,
          email: u.email,
          password: u.password,
          phone: u.phone,
          role: u.role,
          securityQuestion: u.securityQuestion,
          securityAnswerHash,
          isEmailVerified: true,
          isActive: true,
        });
        await newUser.save();
        console.log(`✅ Created demo user: ${u.email} (${u.role})`);
        if (u.email === 'admin@inventory.com') {
          adminId = newUser._id;
        }
      } else {
        existing.role = u.role;
        existing.fullName = u.fullName;
        existing.isActive = true;
        existing.isEmailVerified = true;
        // Reset password to ensure it matches
        existing.password = u.password;
        await existing.save();
        console.log(`✅ Updated existing demo user: ${u.email} (${u.role})`);
        if (u.email === 'admin@inventory.com') {
          adminId = existing._id;
        }
      }
    }

    if (adminId) {
      // Link activity logs without a user to admin
      const actRes = await ActivityLog.updateMany(
        { $or: [{ user: null }, { user: { $exists: false } }] },
        { $set: { user: adminId } }
      );
      console.log(`ℹ️ Updated ${actRes.modifiedCount} activity logs to link with admin user.`);

      // Link sales without createdBy to admin
      const saleRes = await Sale.updateMany(
        { $or: [{ createdBy: null }, { createdBy: { $exists: false } }] },
        { $set: { createdBy: adminId } }
      );
      console.log(`ℹ️ Updated ${saleRes.modifiedCount} sales records to link with admin user.`);
    }

    console.log('\n🎉 Demo users initialization complete!');
  } catch (err) {
    console.error('❌ Error initializing demo users:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

initDemoUsers();
