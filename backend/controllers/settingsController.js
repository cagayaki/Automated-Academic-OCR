const Settings = require('../models/Settings');

// @desc    Get admin settings
// @route   GET /api/settings
// @access  Private (Simulating admin via JWT)
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching configurations' });
  }
};

// @desc    Update admin settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    
    settings.studentIdFormat = req.body.studentIdFormat ?? settings.studentIdFormat;
    settings.gpaMin = req.body.gpaMin ?? settings.gpaMin;
    settings.gpaMax = req.body.gpaMax ?? settings.gpaMax;
    settings.dateFormat = req.body.dateFormat ?? settings.dateFormat;
    settings.temporalValidityYears = req.body.temporalValidityYears ?? settings.temporalValidityYears;
    settings.requireSchoolSeal = req.body.requireSchoolSeal ?? settings.requireSchoolSeal;
    settings.knownInstitutions = req.body.knownInstitutions ?? settings.knownInstitutions;
    settings.requiredFields = req.body.requiredFields ?? settings.requiredFields;
    
    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating configuration' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
