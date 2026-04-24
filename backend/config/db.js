const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    // First try standard connection
    if (mongoUri) {
      try {
        const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (e) {
        console.log('Provided MongoDB URI failed to connect. Falling back to Memory Server...');
      }
    }
    
    // Fallback to memory server for MVP testing
    console.log('Starting In-Memory MongoDB for MVP...');
    const mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
    
    // Seed the memory database automatically once connected
    const seedData = require('../seedDataset');
    await seedData().catch(e => console.log("Seeding issue:", e));
    
    return conn;
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    // Do not process.exit(1) on Vercel
  }
};

module.exports = connectDB;
