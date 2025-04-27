import mongoose from 'mongoose';
import Country from '../../models/Country';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Phone prefixes for common countries
const phonePrefixes = [
  { name: 'United States', prefix: '+1' },
  { name: 'United Kingdom', prefix: '+44' },
  { name: 'Australia', prefix: '+61' },
  { name: 'Canada', prefix: '+1' },
  { name: 'China', prefix: '+86' },
  { name: 'France', prefix: '+33' },
  { name: 'Germany', prefix: '+49' },
  { name: 'India', prefix: '+91' },
  { name: 'Italy', prefix: '+39' },
  { name: 'Japan', prefix: '+81' },
  { name: 'Russia', prefix: '+7' },
  { name: 'Spain', prefix: '+34' },
  { name: 'Brazil', prefix: '+55' },
  { name: 'Mexico', prefix: '+52' },
  { name: 'South Korea', prefix: '+82' },
  { name: 'Netherlands', prefix: '+31' },
  { name: 'Sweden', prefix: '+46' },
  { name: 'Switzerland', prefix: '+41' },
  { name: 'Norway', prefix: '+47' },
  { name: 'Denmark', prefix: '+45' },
  { name: 'Finland', prefix: '+358' },
  { name: 'Poland', prefix: '+48' },
  { name: 'Turkey', prefix: '+90' },
  { name: 'South Africa', prefix: '+27' },
  { name: 'Argentina', prefix: '+54' },
  { name: 'New Zealand', prefix: '+64' },
  { name: 'Singapore', prefix: '+65' },
  { name: 'Ireland', prefix: '+353' },
  { name: 'Portugal', prefix: '+351' },
  { name: 'Greece', prefix: '+30' }
];

async function updatePhonePrefixes() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/geotrainer';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Update each country with its phone prefix
    for (const { name, prefix } of phonePrefixes) {
      const result = await Country.updateOne(
        { name: { $regex: new RegExp(`^${name}$`, 'i') } }, // Case-insensitive match
        { $set: { phone_prefix: prefix } }
      );

      if (result.modifiedCount > 0) {
        console.log(`Updated ${name} with phone prefix ${prefix}`);
      } else {
        console.log(`Country not found or already has the same prefix: ${name}`);
      }
    }

    console.log('Phone prefixes update completed');
  } catch (error) {
    console.error('Error updating phone prefixes:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the update function
updatePhonePrefixes();
