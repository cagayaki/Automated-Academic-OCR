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
    const fileExt = path.extname(absoluteFilePath).toLowerCase();

    // --- PDF: extract text layer directly (instant, no OCR needed) ---
    if (fileExt === '.pdf') {
      const dataBuffer = fs.readFileSync(absoluteFilePath);
      const parser = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
      const data = await parser(dataBuffer);
      return {
        text: data.text,
        confidence: data.text.trim().length > 50 ? 98 : 45
      };
    }

    // --- IMAGE: OCR extraction ---
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;

    if (isVercel) {
      // On Vercel serverless: use OCR.Space API with file upload (more reliable than base64 for large images)
      const FormData = require('form-data');
      const axios = require('axios');

      // Check file size — OCR.Space free tier limit is 1MB
      const stats = fs.statSync(absoluteFilePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > 1.0) {
        // File too large for free API — return empty so validation can still produce a result
        console.warn(`Image too large for free OCR API: ${fileSizeMB.toFixed(2)}MB. Skipping OCR.`);
        return { text: '', confidence: 0 };
      }

      const form = new FormData();
      form.append('apikey', 'helloworld');
      form.append('language', 'eng');
      form.append('isOverlayRequired', 'false');
      form.append('scale', 'true');
      form.append('OCREngine', '1');
      form.append('file', fs.createReadStream(absoluteFilePath));

      const response = await axios.post('https://api.ocr.space/parse/image', form, {
        headers: form.getHeaders(),
        timeout: 9000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const result = response.data;
      if (result?.ParsedResults?.length > 0) {
        const parsed = result.ParsedResults[0];
        if (parsed.ErrorMessage) {
          console.error('OCR.Space error:', parsed.ErrorMessage);
          return { text: '', confidence: 0 };
        }
        return {
          text: parsed.ParsedText || '',
          confidence: 85
        };
      }

      // API returned no results
      console.warn('OCR.Space returned empty results:', JSON.stringify(result?.ErrorMessage || result?.OCRExitCode));
      return { text: '', confidence: 0 };
    }

    // --- LOCAL: use Tesseract.js with fast model ---
    const os = require('os');
    const worker = await Tesseract.createWorker('eng', 1, {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast',
      cachePath: os.tmpdir(),
      gzip: true
    });
    const { data } = await worker.recognize(absoluteFilePath);
    await worker.terminate();

    return {
      text: data.text,
      confidence: data.confidence || 85
    };

  } catch (error) {
    console.error('OCR/PDF Error:', error.message);
    // Return empty text instead of crashing — let validation still run and show "Not Detected" fields
    return { text: '', confidence: 0 };
  }
};

module.exports = { extractText };
