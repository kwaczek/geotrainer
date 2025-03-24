/**
 * Road Signs Seed Script
 * 
 * This script helps populate the database with road sign data.
 * It can be run with: node scripts/seed-roadsigns.js
 * 
 * Make sure to have images in the uploads/roadsigns directory before running.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Load models
const RoadSign = require('../dist/models/RoadSign').default;
const Country = require('../dist/models/Country').default;

// Sample road sign data - replace with your own data
const sampleRoadSigns = [
  {
    imageUrl: '/uploads/roadsigns/sample1.jpg', // Replace with actual filename
    description: 'Stop sign from Germany',
    googleMapsUrl: 'https://goo.gl/maps/example1',
    countryName: 'Germany' // Will be replaced with actual country ID
  },
  {
    imageUrl: '/uploads/roadsigns/sample2.jpg', // Replace with actual filename
    description: 'Yield sign from France',
    googleMapsUrl: 'https://goo.gl/maps/example2',
    countryName: 'France' // Will be replaced with actual country ID
  }
  // Add more samples as needed
];

// Main function
const seedRoadSigns = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    // Get all countries from the database
    const countries = await Country.find();
    const countryMap = {};
    
    // Create a map of country names to IDs
    countries.forEach(country => {
      countryMap[country.name] = country._id;
    });
    
    console.log(`Found ${countries.length} countries in the database`);
    
    // Process each road sign
    for (const signData of sampleRoadSigns) {
      // Find the country ID
      const countryId = countryMap[signData.countryName];
      
      if (!countryId) {
        console.error(`Country not found: ${signData.countryName}`);
        continue;
      }
      
      // Check if the image file exists
      const imagePath = path.join(process.cwd(), signData.imageUrl.replace(/^\//, ''));
      if (!fs.existsSync(imagePath)) {
        console.error(`Image not found: ${imagePath}`);
        continue;
      }
      
      // Create the road sign
      const roadSign = new RoadSign({
        imageUrl: signData.imageUrl,
        description: signData.description,
        googleMapsUrl: signData.googleMapsUrl,
        countries: [countryId]
      });
      
      // Save to database
      await roadSign.save();
      console.log(`Created road sign: ${signData.description}`);
    }
    
    console.log('Road sign seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding road signs:', error);
    process.exit(1);
  }
};

// Run the seed function
seedRoadSigns(); 