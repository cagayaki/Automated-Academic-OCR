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
      const os = require('os');
      const worker = await Tesseract.createWorker('eng', 1, {
        langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast', // Uses ultra-optimized 3MB payload natively
        cachePath: os.tmpdir(), // Absolutely critical for Vercel: redirects AI caching loops strictly to Serverless writable Ephemeral Storage
        gzip: true
      });
      const { data } = await worker.recognize(absoluteFilePath);
      await worker.terminate();
      
      return {
        text: data.text,
        confidence: data.confidence || 85
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
