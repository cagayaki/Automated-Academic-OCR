const Settings = require('../models/Settings');

// @desc    Get admin settings
// @route   GET /api/settings
// @access  Public (Simulating admin)
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update admin settings
// @route   PUT /api/settings
// @access  Public (Simulating admin)
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    
    settings.studentIdFormat = req.body.studentIdFormat || settings.studentIdFormat;
    settings.gpaMin = req.body.gpaMin ?? settings.gpaMin;
    settings.gpaMax = req.body.gpaMax ?? settings.gpaMax;
    settings.requiredFields = req.body.requiredFields || settings.requiredFields;
    settings.institutionName = req.body.institutionName || settings.institutionName;
    
    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
