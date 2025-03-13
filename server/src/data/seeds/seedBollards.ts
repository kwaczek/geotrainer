import mongoose from 'mongoose';
import { connectDB } from '../../config/db';
import Bollard from '../../models/Bollard';
import crypto from 'crypto';

// Import bollards data
import { bollards } from './bollards-data';

interface BollardData {
  _id: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate a consistent ObjectId from a string
 */
const generateConsistentId = (str: string): mongoose.Types.ObjectId => {
  if (!str) {
    throw new Error('String is required for ID generation');
  }
  const hash = crypto.createHash('md5').update(str).digest('hex').substring(0, 24);
  return new mongoose.Types.ObjectId(hash);
};

/**
 * Seed bollards data to the database
 */
const seedBollards = async (): Promise<void> => {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB for seeding bollards...');

    // Clear existing bollards collection
    await Bollard.deleteMany({});
    console.log('Cleared existing bollards collection');

    // Validate and format the data
    const formattedBollards = (bollards as BollardData[]).map(bollard => {
      return {
        _id: bollard._id ? new mongoose.Types.ObjectId(bollard._id) : generateConsistentId(bollard.imageUrl),
        imageUrl: bollard.imageUrl,
        description: bollard.description,
        googleMapsUrl: bollard.googleMapsUrl,
        countries: bollard.countries.map(countryId => new mongoose.Types.ObjectId(countryId)),
        createdAt: bollard.createdAt ? new Date(bollard.createdAt) : new Date(),
        updatedAt: bollard.updatedAt ? new Date(bollard.updatedAt) : new Date()
      };
    });

    // Insert the bollards data
    await Bollard.insertMany(formattedBollards);
    console.log(`Successfully seeded ${formattedBollards.length} bollards to the database`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding bollards data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedBollards(); 