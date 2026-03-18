const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * Extracts text from an image or PDF.
 * @param {string} absoluteFilePath 
 * @returns {Promise<{text: string, confidence: number}>}
 */
const extractText = async (absoluteFilePath) => {
  try {
    const ext = path.extname(absoluteFilePath).toLowerCase();

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(absoluteFilePath);
      const parser = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
      const data = await parser(dataBuffer);
      // pdf-parse extracts textual layers securely; assume high confidence if text is lengthy
      return {
        text: data.text,
        confidence: data.text.trim().length > 50 ? 98 : 45
      };
    } else {
      const worker = await Tesseract.createWorker('eng');
      const { data } = await worker.recognize(absoluteFilePath);
      await worker.terminate();

      return {
        text: data.text,
        confidence: data.confidence
      };
    }
  } catch (error) {
    console.error('OCR/PDF Error:', error);
    throw new Error('Failed to extract text from document. Ensure it is a valid image or readable PDF.');
  }
};

module.exports = {
  extractText
};
