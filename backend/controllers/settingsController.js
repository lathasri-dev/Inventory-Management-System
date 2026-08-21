const Settings = require('../models/Settings');
const mongoose = require('mongoose');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        settings[key] = req.body[key];
      }
    });

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Backup all database collections
// @route   GET /api/settings/backup
// @access  Private (Admin only)
exports.backupDatabase = async (req, res) => {
  try {
    const backupData = {};
    const modelNames = mongoose.modelNames();

    for (const name of modelNames) {
      const model = mongoose.model(name);
      const data = await model.find({});
      backupData[name] = data;
    }

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().slice(0,10)}.json`);
    res.send(JSON.stringify(backupData, null, 2));

    // Update backup date
    let settings = await Settings.findOne();
    if (settings) {
      settings.lastBackupDate = new Date();
      await settings.save();
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Backup failed', error: err.message });
  }
};
