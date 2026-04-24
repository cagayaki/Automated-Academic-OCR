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
      const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
      
      // If deployed on Vercel, route image processing to an external highly-optimised OCR API 
      // because Tesseract WebAssembly triggers 10s serverless memory limit timeouts.
      if (isVercel) {
        const FormData = require('form-data');
        const axios = require('axios');
        
        const form = new FormData();
        form.append('apikey', 'helloworld'); // Free universal public key
        form.append('language', 'eng');
        form.append('isOverlayRequired', 'false');
        form.append('file', fs.createReadStream(absoluteFilePath));
        
        const response = await axios.post('https://api.ocr.space/parse/image', form, {
          headers: form.getHeaders(),
          timeout: 8000 // Ensure it resolves before Vercel kills it
        });
        
        if (response.data && response.data.ParsedResults && response.data.ParsedResults.length > 0) {
          return {
            text: response.data.ParsedResults[0].ParsedText,
            confidence: 85 // Safe external default assumption
          };
        } else {
          throw new Error('External OCR parsing failed.');
        }
      }

      // If running Locally, use maximum processing power with Node.js Tesseract
      const os = require('os');
      const path = require('path');
      
      const timeoutMs = 300000; // 5 minutes globally locally
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => {
        reject(new Error("OCR Engine Timeout: Server execution limits exceeded."));
      }, timeoutMs));

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
