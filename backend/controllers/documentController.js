const multer = require('multer');
const path = require('path');
const Document = require('../models/Document');
const Settings = require('../models/Settings');
const ocrService = require('../services/ocrService');
const validationService = require('../services/validationService');
const fs = require('fs');
const os = require('os');
const mongoose = require('mongoose');

const demoDocuments = [];


const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, os.tmpdir());
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
    const absoluteFilePath = path.join(os.tmpdir(), filename);

    let newDoc;
    if (mongoose.connection.readyState === 1) {
      newDoc = new Document({
        originalFileName: originalname,
        filePath: filePath,
        fileSize: size,
        fileType: mimetype,
        status: 'Pending'
      });
    } else {
      newDoc = {
        _id: 'demo-doc-' + Date.now().toString(),
        originalFileName: originalname,
        filePath: filePath,
        fileSize: size,
        fileType: mimetype,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      demoDocuments.push(newDoc);
    }
    const ocrData = await ocrService.extractText(absoluteFilePath);
    newDoc.extractedText = ocrData.text;
    newDoc.ocrConfidence = ocrData.confidence;

    const extractedFields = validationService.extractFields(ocrData.text);
    Object.assign(newDoc, extractedFields);

    // Rule 7: Duplicate & Fraud Detection
    let duplicateDetected = false;
    if (mongoose.connection.readyState === 1 && extractedFields.studentId) {
      const duplicateRecord = await Document.findOne({ studentId: extractedFields.studentId, status: { $ne: 'Pending' } });
      if (duplicateRecord) duplicateDetected = true;
    } else if (extractedFields.studentId) {
      const memDup = demoDocuments.find(d => d.studentId === extractedFields.studentId && d._id !== newDoc._id && d.status !== 'Pending');
      if (memDup) duplicateDetected = true;
    }

    // Dynamic Rules Configuration Context Hook
    let activeSettings;
    if (mongoose.connection.readyState === 1) {
      activeSettings = await Settings.findOne();
    }
    if (!activeSettings) {
      // Memory boot or missing DB fallback: generate defaults dynamically
      activeSettings = new Settings({});
    }

    const verificationResults = validationService.verifyDocument(ocrData, extractedFields, activeSettings);

    if (duplicateDetected) {
      verificationResults.status = 'Duplicate Submission';
      verificationResults.decisionText = 'Fraud Error: The exact same Student ID has already been submitted to the database previously.';
      verificationResults.authenticityScore = 0;
    }
    
    newDoc.validationResults = verificationResults.checks;
    newDoc.authenticityScore = verificationResults.authenticityScore;
    newDoc.status = verificationResults.status;
    newDoc.decisionText = verificationResults.decisionText;

    if (mongoose.connection.readyState === 1) {
      await newDoc.save();
    }

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
    if (mongoose.connection.readyState !== 1) {
      return res.json(demoDocuments); // Return memory list for demo mode if db is offline
    }
    const documents = await Document.find({}).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getDocumentById = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      let doc = demoDocuments.find(d => d._id === req.params.id);
      return doc ? res.json(doc) : res.status(404).json({ message: 'Document not found or session expired.' });
    }
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
