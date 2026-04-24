const mongoose = require('mongoose');

const documentSchema = mongoose.Schema({
  originalFileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String },
  extractedText: { type: String },
  decisionText: { type: String },
  ocrConfidence: { type: Number },
  status: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Needs Review', 'Invalid'],
    default: 'Pending'
  },
  validationResults: { type: Object },
  authenticityScore: { type: Number },
  studentName: { type: String },
  studentId: { type: String },
  course: { type: String },
  institutionName: { type: String },
  dateIssued: { type: String },
  gpa: { type: String }
}, {
  timestamps: true
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
