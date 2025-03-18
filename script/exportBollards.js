const mongoose = require('mongoose');
const fs = require('fs');

// MongoDB connection string - adjust as needed
const MONGO_URI = 'mongodb://localhost:27017/geotrainer';

// Define the Bollard schema
const BollardSchema = new mongoose.Schema({
  imageUrl: String,
  description: String,
  googleMapsUrl: String,
  countries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Country' }]
}, {
  timestamps: true
});

// Create the model
const Bollard = mongoose.model('Bollard', BollardSchema);

async function exportBollards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Fetch all bollards
    const bollards = await Bollard.find({}).lean();
    console.log(`Found ${bollards.length} bollards`);

    // Convert ObjectId to string for countries
    const formattedBollards = bollards.map(bollard => ({
      ...bollard,
      countries: bollard.countries.map(country => country.toString())
    }));

    // Write to file
    fs.writeFileSync('bollards-data.js', `export const bollards = ${JSON.stringify(formattedBollards, null, 2)};`);
    console.log('Bollards data exported to bollards-data.js');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error exporting bollards:', error);
    process.exit(1);
  }
}

exportBollards(); 