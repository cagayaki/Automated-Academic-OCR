const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema({
  studentIdFormat: { type: String, default: '^\\d{4}-\\d{5}$' },
  gpaMin: { type: Number, default: 0.00 },
  gpaMax: { type: Number, default: 5.00 },
  requiredFields: { 
    type: [String], 
    default: ['studentId', 'gpa', 'dateIssued'] 
  },
  institutionName: { type: String, default: 'University Demo' }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
