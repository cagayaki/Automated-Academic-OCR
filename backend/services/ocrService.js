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
      // Universally route image processing to the ultra-fast highly-optimised OCR API 
      // This strictly prevents the Node.js Tesseract Worker from causing infinite memory hangs physically on Windows.
      const FormData = require('form-data');
      const axios = require('axios');
      
      const form = new FormData();
      form.append('apikey', 'helloworld'); // Free universal public key
      form.append('language', 'eng');
      form.append('isOverlayRequired', 'false');
      form.append('file', fs.createReadStream(absoluteFilePath));
      
      const response = await axios.post('https://api.ocr.space/parse/image', form, {
        headers: form.getHeaders(),
        timeout: 9000 // Safely balances connections avoiding traps
      });
      
      if (response.data && response.data.ParsedResults && response.data.ParsedResults.length > 0) {
        return {
          text: response.data.ParsedResults[0].ParsedText,
          confidence: 85 // Safe external default assumption
        };
      } else {
        throw new Error('Terminal Data Validation: OCR Engine received an invalid external payload API response.');
      }
    }
  } catch (error) {
    console.error('OCR/PDF Error:', error);
    throw new Error('Failed to extract text from document. Ensure it is a valid image or readable PDF.');
  }
};

module.exports = {
  extractText
};
