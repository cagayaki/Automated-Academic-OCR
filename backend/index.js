const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
// Store the connection promise
const dbPromise = connectDB();

const path = require('path');
const documentRoutes = require('./routes/documentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Ensure DB is connected before processing any request
app.use(async (req, res, next) => {
  await dbPromise;
  next();
});

app.use(cors());
app.use(express.json());

// Serve uploaded files statically from OS temp directory
const os = require('os');
app.use('/uploads', express.static(os.tmpdir()));

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 5000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

const seedData = require('./seedDataset');

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await seedData();
  });
}

module.exports = app;
