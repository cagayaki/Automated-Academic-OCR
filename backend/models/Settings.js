const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema({
  studentIdFormat: { type: String, default: '^[A-Z0-9-]{5,15}$' },
  gpaMin: { type: Number, default: 0.00 },
  gpaMax: { type: Number, default: 5.00 },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  temporalValidityYears: { type: Number, default: 5 },
  requireSchoolSeal: { type: Boolean, default: true },
  knownInstitutions: { 
    type: [String], 
    default: ["Harvard University", "MIT", "Stanford", "UCLA", "Oxford", "Global University", "Stanford University", "Oxford University"] 
  },
  requiredFields: { 
    type: [String], 
    default: ['studentName', 'studentId', 'course', 'institutionName', 'dateIssued', 'gpa'] 
  }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
