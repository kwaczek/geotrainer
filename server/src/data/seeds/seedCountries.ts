import mongoose from 'mongoose';
import { connectDB } from '../../config/db';
import Country from '../../models/Country';
import crypto from 'crypto';

// Import countries data
import { countries } from './countries';

interface CountryData {
  name: string;
  capital: string;
  continent: string;
  in_geoguessr: boolean;
  code: string;
}

/**
 * Generate a consistent ObjectId from a string
 */
const generateConsistentId = (str: string): mongoose.Types.ObjectId => {
  if (!str) {
    throw new Error('Country code is required for ID generation');
  }
  const hash = crypto.createHash('md5').update(str).digest('hex').substring(0, 24);
  return new mongoose.Types.ObjectId(hash);
};

/**
 * Seed countries data to the database
 */
const seedCountries = async (): Promise<void> => {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB for seeding...');

    // Clear existing countries collection
    await Country.deleteMany({});
    console.log('Cleared existing countries collection');

    // Validate and format the data
    const formattedCountries = (countries as CountryData[]).map(country => {
      if (!country.code) {
        throw new Error(`Country ${country.name} is missing a code`);
      }
      return {
        _id: generateConsistentId(country.code),
        name: country.name,
        capital: country.capital,
        continent: country.continent,
        in_geoguessr: country.in_geoguessr,
        code: country.code
      };
    });

    // Insert the countries data
    await Country.insertMany(formattedCountries);
    console.log(`Successfully seeded ${formattedCountries.length} countries to the database`);

    // Log Iceland's ID for reference (since we have a bollard from Iceland)
    const iceland = formattedCountries.find(c => c.code === 'is');
    if (iceland) {
      console.log('Iceland ID for reference:', iceland._id.toString());
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding countries data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedCountries();
