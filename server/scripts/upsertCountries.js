// Script to upsert countries data into the database
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Country = require('../dist/models/Country').default;

// Read the countries file
const countriesPath = path.join(__dirname, '../src/data/seeds/countries.ts');
const countriesContent = fs.readFileSync(countriesPath, 'utf8');

// Extract the countries array using regex
const countriesMatch = countriesContent.match(/export const countries = (\[[\s\S]*?\]);/);
if (!countriesMatch || !countriesMatch[1]) {
  console.error('Could not extract countries array from file');
  process.exit(1);
}

// Parse the countries array
let countries;
try {
  // Replace single quotes with double quotes for JSON parsing
  const jsonStr = countriesMatch[1].replace(/'/g, '"');
  countries = JSON.parse(jsonStr);
} catch (err) {
  console.error('Error parsing countries JSON:', err);
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/geotrainer')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function upsertCountries() {
  console.log(`Starting upsert of ${countries.length} countries...`);
  let updated = 0;
  let created = 0;
  
  try {
    // Process each country
    for (const country of countries) {
      // Try to find the country by name
      const existingCountry = await Country.findOne({ name: country.name });
      
      if (existingCountry) {
        // Update existing country
        await Country.updateOne(
          { _id: existingCountry._id },
          { 
            $set: {
              capital: country.capital,
              continent: country.continent,
              in_geoguessr: country.in_geoguessr,
              code: country.code
            }
          }
        );
        updated++;
      } else {
        // Create new country
        await Country.create(country);
        created++;
      }
    }
    
    console.log(`Upsert complete: ${updated} countries updated, ${created} countries created`);
  } catch (error) {
    console.error('Error upserting countries:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

// Run the upsert function
upsertCountries();
