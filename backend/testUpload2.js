const fs = require('fs');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const FormData = require('form-data');

const test = async () => {
  const file = 'test.pdf';
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(file));
  doc.text('Harvard University\nStudent Name: John Doe\nStudent ID: 2023-10001\nCourse: BS Computer Science\nDate Issued: 05/20/2023\nGPA: 3.8');
  doc.end();
  
  await new Promise(r => setTimeout(r, 1000));
  
  try {
    const form = new FormData();
    form.append('document', fs.createReadStream(file));
    const res = await axios.post('http://127.0.0.1:5000/api/documents/upload', form, { headers: form.getHeaders() });
    console.log('API SUCCESS:', res.data.message);
  } catch(e) {
    if (e.response) {
      console.log('API ERROR RESPONSE:', e.response.status, e.response.data);
    } else {
      console.log('NETWORK ERROR:', e.message);
    }
  }
}
test();
