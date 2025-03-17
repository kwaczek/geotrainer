const mongoose = require('mongoose');
// Try to use the same MongoDB URI as the application
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/geotrainer';

// Connect to MongoDB
mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get the Country model
    const Country = mongoose.model('Country', new mongoose.Schema({
      name: String,
      capital: String,
      continent: String,
      in_geoguessr: Boolean,
      code: String
    }));

    // Update Azerbaijan
    const azerbaijanResult = await Country.updateOne(
      { name: 'Azerbaijan' },
      { $set: { in_geoguessr: false } }
    );
    console.log('Azerbaijan update result:', azerbaijanResult);
    
    // Update Cyprus
    const cyprusResult = await Country.updateOne(
      { name: 'Cyprus' },
      { $set: { continent: 'Europe' } }
    );
    console.log('Cyprus update result:', cyprusResult);
    
    // Verify the changes
    const azerbaijan = await Country.findOne({ name: 'Azerbaijan' });
    console.log('Azerbaijan after update:', azerbaijan ? {
      name: azerbaijan.name,
      in_geoguessr: azerbaijan.in_geoguessr,
      continent: azerbaijan.continent
    } : 'Not found');
    
    const cyprus = await Country.findOne({ name: 'Cyprus' });
    console.log('Cyprus after update:', cyprus ? {
      name: cyprus.name,
      in_geoguessr: cyprus.in_geoguessr,
      continent: cyprus.continent
    } : 'Not found');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }); 