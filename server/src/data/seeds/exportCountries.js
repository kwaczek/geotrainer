const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection string - adjust as needed
const MONGO_URI = 'mongodb://localhost:27017/geotrainer';

// Define the Country schema
const CountrySchema = new mongoose.Schema({
  name: String,
  capital: String,
  continent: String,
  in_geoguessr: Boolean,
  code: String
});

// Create the model
const Country = mongoose.model('Country', CountrySchema);

async function exportCountries() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Fetch all countries
    const countries = await Country.find({}).lean();
    console.log(`Found ${countries.length} countries`);

    // Format countries for export
    const formattedCountries = countries.map(country => ({
      name: country.name,
      capital: country.capital,
      continent: country.continent,
      in_geoguessr: country.in_geoguessr,
      code: country.code
    }));

    // Get the absolute path to the output file
    const outputPath = path.resolve(__dirname, 'countries.ts');

    // Write to file
    fs.writeFileSync(outputPath, `export const countries = ${JSON.stringify(formattedCountries, null, 2)};`);
    console.log(`Countries data exported to ${outputPath}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error exporting countries:', error);
    process.exit(1);
  }
}

exportCountries(); 