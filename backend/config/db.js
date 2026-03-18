const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (e) {
      console.log('Local MongoDB not running. Starting In-Memory MongoDB for MVP...');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      
      // Mongoose 6+ default behavior handles options elegantly
      await mongoose.connect(mongoUri);
      console.log(`In-Memory MongoDB Connected: ${mongoose.connection.host}`);
    }
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
