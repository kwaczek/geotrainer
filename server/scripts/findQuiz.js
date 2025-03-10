const mongoose = require('mongoose');

// Define the QuestionAttempt schema
const QuestionAttemptSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  correctCountryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  selectedCountryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', default: null },
  isCorrect: { type: Boolean, required: true },
  timeSpentMs: { type: Number, required: true }
});

// Define the QuizResult schema
const QuizResultSchema = new mongoose.Schema({
  quizId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, required: true },
  quizType: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  isCompleted: { type: Boolean, default: false },
  totalScore: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  totalTimeSpentMs: { type: Number, default: 0 },
  questionAttempts: [QuestionAttemptSchema],
}, { timestamps: true });

// Create the model
const QuizResult = mongoose.model('QuizResult', QuizResultSchema);

async function findSpecificQuiz() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/geotrainer', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Find the quiz by ID
    const quizId = '439b800d-8c25-44fc-9116-b8073307220d';
    const quiz = await QuizResult.findOne({ quizId });
    
    if (quiz) {
      console.log(`Found quiz with ID: ${quizId}`);
      console.log(JSON.stringify(quiz.toObject(), null, 2));
      
      console.log('\nQuestion Attempts:');
      if (quiz.questionAttempts && quiz.questionAttempts.length > 0) {
        console.log(`Total attempts: ${quiz.questionAttempts.length}`);
        quiz.questionAttempts.forEach((attempt, index) => {
          console.log(`\n--- Question Attempt ${index + 1} ---`);
          console.log(`Question: ${attempt.questionText}`);
          console.log(`Correct: ${attempt.isCorrect}`);
          console.log(`Time spent: ${attempt.timeSpentMs}ms`);
          console.log(`Correct Country ID: ${attempt.correctCountryId}`);
          console.log(`Selected Country ID: ${attempt.selectedCountryId || 'None'}`);
        });
      } else {
        console.log('No question attempts found for this quiz');
      }
    } else {
      console.log(`Quiz with ID ${quizId} not found`);
      
      // Check if there are any quizzes in the database
      const count = await QuizResult.countDocuments();
      console.log(`Total number of quizzes in database: ${count}`);
      
      if (count > 0) {
        // Show the most recent quiz
        const latestQuiz = await QuizResult.findOne().sort({ createdAt: -1 });
        console.log('\nMost recent quiz:');
        console.log(`Quiz ID: ${latestQuiz.quizId}`);
        console.log(`Created at: ${latestQuiz.createdAt}`);
        console.log(`Question attempts: ${latestQuiz.questionAttempts.length}`);
      }
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

findSpecificQuiz();
