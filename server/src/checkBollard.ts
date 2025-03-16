import mongoose from 'mongoose';
import Bollard from './models/Bollard';
import QuizResult from './models/QuizResult';
import Country from './models/Country';

async function checkBollardQuestion() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/geotrainer');
    
    console.log('Connected to MongoDB');
    
    // First, check the quiz result to get the questionId
    const quizId = '4aceffdf-a289-4676-985f-d3be07171301';
    const questionId = '67d655a2c5a90c1faa362d22';
    
    // Find the quiz
    const quizResult = await QuizResult.findOne({ quizId });
    console.log('Quiz result:', quizResult ? 'Found' : 'Not found');
    
    if (quizResult) {
      // Find the specific question attempt
      const attempt = quizResult.questionAttempts.find(a => a.questionId === questionId);
      console.log('Question attempt:', attempt ? JSON.stringify(attempt, null, 2) : 'Not found');
      
      if (attempt && attempt.correctCountryId) {
        // Get the correctCountryId
        const correctCountryId = attempt.correctCountryId;
        console.log('Correct Country ID:', correctCountryId);
        
        // Get the country name
        const country = await Country.findById(correctCountryId);
        console.log('Correct Country:', country ? country.name : 'Not found');
        
        // Find the specific bollard with this image
        if (attempt.imageUrl) {
          const bollard = await Bollard.findOne({ imageUrl: attempt.imageUrl });
          console.log('Bollard found:', bollard ? 'Yes' : 'No');
          
          if (bollard) {
            // Get all countries associated with this bollard
            const countries = await Country.find({ _id: { $in: bollard.countries } });
            console.log('Countries for this bollard:');
            countries.forEach(c => {
              console.log(`- ${c.name} (${c._id})`);
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
checkBollardQuestion(); 