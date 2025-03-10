const mongoose = require('mongoose');

async function emptyQuizResultsCollection() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/geotrainer', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Get the quizresults collection
    const collection = mongoose.connection.collection('quizresults');
    
    // Count documents before deletion
    const countBefore = await collection.countDocuments();
    console.log(`Found ${countBefore} documents in the quizresults collection before deletion`);
    
    // Delete all documents
    const result = await collection.deleteMany({});
    console.log(`Deleted ${result.deletedCount} documents from the quizresults collection`);
    
    // Verify collection is empty
    const countAfter = await collection.countDocuments();
    console.log(`Collection now has ${countAfter} documents`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

emptyQuizResultsCollection();
