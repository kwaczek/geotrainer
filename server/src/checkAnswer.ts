import mongoose from 'mongoose';
import Bollard from './models/Bollard';
import LicensePlate from './models/LicensePlate';
import QuizResult from './models/QuizResult';
import Country from './models/Country';

async function checkAnswer() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/geotrainer');
    
    console.log('Connected to MongoDB');
    
    // Quiz and question details
    const quizId = 'cae09808-e20d-4acc-acd3-d16e84098705';
    const questionId = '67d66ad7f2fcd32127b74473';
    const userInput = 'Luxembourg';
    
    // Find the quiz
    const quizResult = await QuizResult.findOne({ quizId });
    console.log('Quiz result:', quizResult ? 'Found' : 'Not found');
    
    if (quizResult) {
      console.log('Quiz type:', quizResult.type);
      
      // Find the specific question attempt
      const attempt = quizResult.questionAttempts.find(a => a.questionId === questionId);
      console.log('Question attempt:', attempt ? JSON.stringify(attempt, null, 2) : 'Not found');
      
      if (attempt && attempt.imageUrl) {
        // Determine which model to use based on quiz type
        let item;
        let countries;
        
        if (quizResult.type === 'bollards') {
          // Find the bollard with this image
          item = await Bollard.findOne({ imageUrl: attempt.imageUrl });
          console.log('Bollard found:', item ? 'Yes' : 'No');
        } else if (quizResult.type === 'licenseplates') {
          // Find the license plate with this image
          item = await LicensePlate.findOne({ imageUrl: attempt.imageUrl });
          console.log('License plate found:', item ? 'Yes' : 'No');
        }
        
        if (item) {
          // Get all countries associated with this item
          countries = await Country.find({ _id: { $in: item.countries } });
          console.log('Associated countries:');
          countries.forEach(c => {
            console.log(`- ${c.name} (${c._id})`);
          });
          
          // Check if Luxembourg is one of the valid countries
          const luxCountry = countries.find(c => c.name.toLowerCase() === userInput.toLowerCase());
          console.log('');
          console.log(`Is "${userInput}" a valid answer?`, luxCountry ? 'YES' : 'NO');
          
          // List all valid countries
          console.log('\nAll valid answers:');
          console.log(countries.map(c => c.name).join(', '));
          
          // Check for near matches (might be a spelling issue)
          console.log('\nChecking for similar country names:');
          countries.forEach(c => {
            const similarity = calculateSimilarity(userInput.toLowerCase(), c.name.toLowerCase());
            console.log(`- ${c.name}: ${Math.round(similarity * 100)}% similar`);
          });
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

// Helper function to calculate string similarity (0-1 where 1 is identical)
function calculateSimilarity(s1: string, s2: string): number {
  let longer = s1.length > s2.length ? s1 : s2;
  let shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

function editDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  
  const costs: number[] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  
  return costs[s2.length];
}

// Run the function
checkAnswer(); 