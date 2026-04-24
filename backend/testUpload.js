const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const testUpload = async () => {
  try {
    const form = new FormData();
    form.append('document', fs.createReadStream('c:/ocrSystem/backend/uploads/sample1.pdf'));
    
    // Simulate logged in Registrar uploading a document
    const res = await axios.post('http://localhost:5000/api/documents/upload', form, {
      headers: form.getHeaders()
    });
    
    console.log('SUCCESS:', res.data.message);
  } catch (err) {
    if (err.response) {
      console.error('SERVER ERROR:', err.response.data);
    } else {
      console.error('NETWORK ERROR:', err.message);
    }
  }
};

testUpload();
