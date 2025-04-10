import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/geotrainer';

// Add Mongoose event listeners for detailed logging
mongoose.connection.on('connecting', () => {
  console.log('Mongoose: Connecting...');
});
mongoose.connection.on('connected', () => {
  console.log('Mongoose: Connected.'); // Note: This might appear before the one in the try block
});
mongoose.connection.on('error', (err) => {
  console.error('Mongoose: Connection Error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose: Disconnected.');
});
mongoose.connection.on('reconnected', () => {
  console.log('Mongoose: Reconnected.');
});

export const connectDB = async (): Promise<void> => {
  try {
    console.log(`Attempting to connect to MongoDB at: ${MONGO_URI}`); // Log the URI being used
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully via connectDB function'); // Clarified log message
  } catch (error) {
    console.error('MongoDB connection error caught in connectDB:', error);
    process.exit(1);
  }
};
