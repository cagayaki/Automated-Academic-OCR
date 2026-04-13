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
      const path = require('path');
      
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => {
        reject(new Error("OCR Engine Timeout: Vercel Serverless execution limits exceeded. Tesseract OCR requires more than 10 seconds to process heavy images."));
      }, 8500)); // Strict 8.5s timeout to guarantee Vercel Serverless compatibility

      const ocrPromise = (async () => {
        const worker = await Tesseract.createWorker('eng', 1, {
          cachePath: os.tmpdir(),
          langPath: path.join(__dirname, '..'),
          gzip: false 
        });
        const { data } = await worker.recognize(absoluteFilePath);
        worker.terminate().catch(console.error);
        return { text: data.text, confidence: data.confidence };
      })();

      // Race the entire OCR engine (initialization AND scanning) against a 4.5s strict timer
      return await Promise.race([ocrPromise, timeoutPromise]);
    }
  } catch (error) {
    console.error('OCR/PDF Error:', error);
    throw new Error('Failed to extract text from document. Ensure it is a valid image or readable PDF.');
  }
};

module.exports = {
  extractText
};
