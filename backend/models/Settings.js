const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema({
  studentIdFormat: { type: String, default: '^[A-Z0-9-]{5,15}$' },
  gpaMin: { type: Number, default: 1.00 },
  gpaMax: { type: Number, default: 5.00 },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  temporalValidityYears: { type: Number, default: 5 },
  confidenceThreshold: { type: Number, default: 75 },
  requireSchoolSeal: { type: Boolean, default: true },
  knownInstitutions: { 
    type: [String], 
    default: [
      "University of the Philippines", "Polytechnic University of the Philippines",
      "De La Salle University", "Ateneo de Manila University", 
      "University of Santo Tomas", "Far Eastern University",
      "Technological University of the Philippines", "Pamantasan ng Lungsod ng Maynila",
      "Adamson University", "Mapua University", "National University",
      "University of the East", "Centro Escolar University"
    ] 
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
