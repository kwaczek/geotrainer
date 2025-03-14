const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection string - adjust as needed
const MONGO_URI = 'mongodb://localhost:27017/geotrainer';

// Define the LicensePlate schema
const LicensePlateSchema = new mongoose.Schema({
  imageUrl: String,
  description: String,
  googleMapsUrl: String,
  countries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Country' }]
}, {
  timestamps: true
});

// Create the model
const LicensePlate = mongoose.model('LicensePlate', LicensePlateSchema);

async function exportLicensePlates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Fetch all license plates
    const licensePlates = await LicensePlate.find({}).lean();
    console.log(`Found ${licensePlates.length} license plates`);

    // Convert ObjectId to string for countries
    const formattedLicensePlates = licensePlates.map(licensePlate => ({
      ...licensePlate,
      countries: licensePlate.countries.map(country => country.toString())
    }));

    // Get the absolute path to the output file
    const outputPath = path.resolve(__dirname, 'plates-data.ts');

    // Create the file content with the interface
    const fileContent = `export interface LicensePlateData {
  _id?: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export const plates: LicensePlateData[] = ${JSON.stringify(formattedLicensePlates, null, 2)};`;

    // Write to file
    fs.writeFileSync(outputPath, fileContent);
    console.log(`License plates data exported to ${outputPath}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error exporting license plates:', error);
    process.exit(1);
  }
}

exportLicensePlates(); 