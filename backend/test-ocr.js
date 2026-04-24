const ocrService = require('./services/ocrService');
const path = require('path');

async function run() {
  console.time('OCR Time');
  try {
    const res = await ocrService.extractText(path.join(__dirname, 'test.pdf')); // Wait, the image hung, not PDF. We need an image.
  } catch (e) {
    console.error(e);
  }
}
run();
