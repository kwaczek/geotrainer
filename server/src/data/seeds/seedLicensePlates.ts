import mongoose from 'mongoose';
import { connectDB } from '../../config/db';
import LicensePlate from '../../models/LicensePlate';
import crypto from 'crypto';

// Import license plates data
import { plates, LicensePlateData } from './plates-data';

// Generate a consistent ID based on a unique property
function generateConsistentId(uniqueString: string): mongoose.Types.ObjectId {
  const hash = crypto.createHash('md5').update(uniqueString).digest('hex').substring(0, 24);
  return new mongoose.Types.ObjectId(hash);
}

/**
 * Seed license plates data to the database
 */
const seedLicensePlates = async (): Promise<void> => {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB for seeding license plates...');

    // Clear existing license plates collection
    await LicensePlate.deleteMany({});
    console.log('Cleared existing license plates collection');

    // Validate and format the data
    const formattedLicensePlates = plates.map((plate: LicensePlateData) => {
      return {
        _id: plate._id ? new mongoose.Types.ObjectId(plate._id) : generateConsistentId(plate.imageUrl),
        imageUrl: plate.imageUrl,
        description: plate.description,
        countries: plate.countries.map((countryId: string) => new mongoose.Types.ObjectId(countryId)),
        createdAt: plate.createdAt ? new Date(plate.createdAt) : new Date(),
        updatedAt: plate.updatedAt ? new Date(plate.updatedAt) : new Date()
      };
    });

    // Insert the license plates data
    await LicensePlate.insertMany(formattedLicensePlates);
    console.log(`Successfully seeded ${formattedLicensePlates.length} license plates to the database`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding license plates data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedLicensePlates(); 