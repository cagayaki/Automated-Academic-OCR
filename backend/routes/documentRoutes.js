const express = require('express');
const router = express.Router();
const { 
  upload, 
  uploadDocument, 
  getDocuments, 
  getDocumentById,
  updateDocumentStatus
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getDocuments);

router.post('/upload', protect, upload.single('document'), uploadDocument);

router.route('/:id')
  .get(protect, getDocumentById);

router.put('/:id/status', protect, updateDocumentStatus);

module.exports = router;
