const multer = require('multer');
const path = require('path');
const Document = require('../models/Document');
const ocrService = require('../services/ocrService');
const validationService = require('../services/validationService');
const fs = require('fs');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10000000 },
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, filename, size, mimetype } = req.file;
    const filePath = `uploads/${filename}`;
    const absoluteFilePath = path.join(__dirname, '../uploads', filename);

    const newDoc = await Document.create({
      originalFileName: originalname,
      filePath: filePath,
      fileSize: size,
      fileType: mimetype,
      status: 'Pending'
    });

    const ocrData = await ocrService.extractText(absoluteFilePath);
    newDoc.extractedText = ocrData.text;
    newDoc.ocrConfidence = ocrData.confidence;

    const extractedFields = validationService.extractFields(ocrData.text);
    Object.assign(newDoc, extractedFields);

    const verificationResults = validationService.verifyDocument(ocrData, extractedFields);
    
    newDoc.validationResults = verificationResults.checks;
    newDoc.authenticityScore = verificationResults.authenticityScore;
    newDoc.status = verificationResults.status;
    newDoc.decisionText = verificationResults.decisionText;

    await newDoc.save();

    res.status(201).json({
      message: 'Document uploaded and verified',
      document: newDoc
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during document processing', error: error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({}).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    document.status = status;
    await document.save();
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  upload,
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocumentStatus
};
