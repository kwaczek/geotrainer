import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import QuizResult, { QuizType } from '../models/QuizResult';
import Country from '../models/Country';
import Bollard from '../models/Bollard';

// Interface for quiz filters
interface QuizFilters {
  continent?: string;
  in_geoguessr?: boolean;
  [key: string]: any;
}

// Interface for quiz session
interface QuizSession {
  sessionId: string;
  quizType: QuizType;
  score: number;
  questionCount: number;
  attempts: any[];
  lastUpdated: Date;
  filters?: QuizFilters;
  currentQuestion?: {
    id: string;
    question: string;
    imageUrl?: string;
    options: any[];
  };
}

// Define the PopulatedQuestionAttempt interface at the top of the file
interface PopulatedCountry {
  _id: mongoose.Types.ObjectId;
  name: string;
}

interface PopulatedQuestionAttempt {
  questionId: string;
  questionText: string;
  correctCountryId: PopulatedCountry;
  selectedCountryId: PopulatedCountry | null;
  isCorrect: boolean;
  timeSpentMs: number;
  imageUrl?: string;
}

// In-memory session storage (in production, this should be in Redis or a database)
const sessions = new Map<string, QuizSession>();

/**
 * Initialize a new quiz session
 * @route POST /api/quiz-sessions
 */
export const initQuizSession = async (req: Request, res: Response) => {
  try {
    const { type, userName, filters } = req.body;
    
    // Validate quiz type
    if (!type || ![QuizType.FLAGS, QuizType.CAPITALS, QuizType.BOLLARDS].includes(type.toLowerCase() as QuizType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz type. Must be either "flags", "capitals", or "bollards"'
      });
    }
    
    // Create a new quiz session in the database
    const quizResult = await QuizResult.create({
      quizId: uuidv4(),
      userName: userName || 'Anonymous',
      type: type.toLowerCase() as QuizType,
      filters: filters || {}
    });
    
    await quizResult.save();
    
    // Also create an in-memory session with the same ID
    const sessionId = quizResult.quizId;
    sessions.set(sessionId, {
      sessionId,
      quizType: type.toLowerCase() as QuizType,
      score: 0,
      questionCount: 0,
      attempts: [],
      lastUpdated: new Date(),
      filters
    });
    
    return res.status(201).json({
      success: true,
      quizId: sessionId,
      message: 'Quiz session initialized successfully'
    });
  } catch (error: any) {
    console.error('Error initializing quiz session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize quiz session',
      error: error.message
    });
  }
};

/**
 * Get a quiz session by ID
 * @route GET /api/quiz-sessions/:sessionId
 */
export const getQuizSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // Try to get the session from memory first
    const session = sessions.get(sessionId);
    
    if (session) {
      return res.json({
        success: true,
        sessionId: session.sessionId,
        quizType: session.quizType,
        score: session.score,
        questionCount: session.questionCount,
        attempts: session.attempts,
        currentQuestion: session.currentQuestion,
        filters: session.filters
      });
    }
    
    // If not in memory, try to get from database
    const quizResult = await QuizResult.findOne({ quizId: sessionId });
    
    if (!quizResult) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found'
      });
    }
    
    // Create a new in-memory session from the database record
    const newSession: QuizSession = {
      sessionId: quizResult.quizId,
      quizType: quizResult.type,
      score: quizResult.totalScore || 0,
      questionCount: quizResult.totalQuestions || 0,
      attempts: quizResult.questionAttempts || [],
      lastUpdated: new Date(),
      filters: quizResult.filters
    };
    
    sessions.set(sessionId, newSession);
    
    return res.json({
      success: true,
      sessionId: newSession.sessionId,
      quizType: newSession.quizType,
      score: newSession.score,
      questionCount: newSession.questionCount,
      attempts: newSession.attempts,
      filters: newSession.filters
    });
  } catch (error: any) {
    console.error('Error getting quiz session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get quiz session',
      error: error.message
    });
  }
};

/**
 * Get the next question for a quiz
 * @route GET /api/quiz-questions/:quizType
 */
export const getNextQuestion = async (req: Request, res: Response) => {
  try {
    const { quizType } = req.params;
    const sessionId = req.query.sessionId as string || uuidv4();
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) as QuizFilters : undefined;
    
    console.log(`Getting next question for ${quizType} quiz, sessionId: ${sessionId}, filters:`, filters);
    
    // Validate quiz type
    if (!quizType || ![QuizType.FLAGS, QuizType.CAPITALS, QuizType.BOLLARDS].includes(quizType.toLowerCase() as QuizType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz type. Must be either "flags", "capitals", or "bollards"'
      });
    }
    
    // Get or create session
    let session = sessions.get(sessionId);
    
    if (!session) {
      console.log(`Session ${sessionId} not found, checking database...`);
      // Check if there's a quiz result in the database
      const existingQuiz = await QuizResult.findOne({ quizId: sessionId });
      
      if (existingQuiz) {
        console.log(`Found existing quiz in database, creating session...`);
        session = {
          sessionId,
          quizType: existingQuiz.type,
          score: existingQuiz.totalScore || 0,
          questionCount: existingQuiz.totalQuestions || 0,
          attempts: existingQuiz.questionAttempts || [],
          lastUpdated: new Date(),
          filters: existingQuiz.filters
        };
      } else {
        console.log(`Creating new session with ID: ${sessionId}`);
        // Create a new session
        session = {
          sessionId,
          quizType: quizType.toLowerCase() as QuizType,
          score: 0,
          questionCount: 0,
          attempts: [],
          lastUpdated: new Date(),
          filters
        };
        
        // Also create a database record if it doesn't exist
        await QuizResult.create({
          quizId: sessionId,
          userName: 'Anonymous',
          type: quizType.toLowerCase() as QuizType,
          filters: filters || {}
        });
        
        console.log(`Created new quiz result in database with ID: ${sessionId}`);
      }
      
      sessions.set(sessionId, session);
    }
    
    // If session has a current question and it hasn't been answered yet, return it
    if (session.currentQuestion && session.attempts.length === session.questionCount) {
      console.log(`Returning existing question from session: ${session.currentQuestion.id}`);
      return res.json({
        success: true,
        question: session.currentQuestion,
        sessionId: session.sessionId
      });
    }
    
    // Otherwise, get a new question based on the quiz type
    let question;
    
    try {
      switch (quizType.toLowerCase()) {
        case QuizType.FLAGS:
          question = await getRandomFlagQuestion(session.filters);
          break;
        case QuizType.CAPITALS:
          question = await getRandomCapitalQuestion(session.filters);
          break;
        case QuizType.BOLLARDS:
          question = await getRandomBollardQuestion(session.filters);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid quiz type'
          });
      }
      
      console.log(`Generated new question: ${question.id}`);
    } catch (error: any) {
      console.error(`Error generating question for ${quizType}:`, error);
      return res.status(500).json({
        success: false,
        message: `Failed to generate ${quizType} question`,
        error: error.message
      });
    }
    
    // Update the session with the new question
    session.currentQuestion = question;
    session.lastUpdated = new Date();
    sessions.set(sessionId, session);
    
    return res.json({
      success: true,
      question,
      sessionId
    });
  } catch (error: any) {
    console.error('Error getting next question:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get next question',
      error: error.message
    });
  }
};

/**
 * Submit an answer for a quiz question
 * @route POST /api/quiz-answers/:quizType
 */
export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const { quizType } = req.params;
    const { sessionId, questionId, selectedOptionId, isCorrect, timeSpentMs } = req.body;
    
    console.log('Received answer submission:', {
      quizType,
      sessionId,
      questionId,
      selectedOptionId,
      isCorrect,
      timeSpentMs
    });
    
    // Validate required fields
    if (!sessionId || !questionId || !selectedOptionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, question ID, and selected option ID are required'
      });
    }
    
    // Get the session
    let session = sessions.get(sessionId);
    
    // If session not found, try to create it from the database
    if (!session) {
      console.log(`Session ${sessionId} not found in memory, checking database...`);
      const quizResult = await QuizResult.findOne({ quizId: sessionId });
      
      if (quizResult) {
        console.log(`Found quiz result in database, creating session...`);
        session = {
          sessionId,
          quizType: quizResult.type,
          score: quizResult.totalScore || 0,
          questionCount: quizResult.totalQuestions || 0,
          attempts: quizResult.questionAttempts || [],
          lastUpdated: new Date(),
          filters: quizResult.filters
        };
        sessions.set(sessionId, session);
      } else {
        console.log(`No quiz result found in database for session ${sessionId}`);
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
    }
    
    // Get the current question or create a placeholder if not available
    let currentQuestion = session.currentQuestion;
    
    if (!currentQuestion) {
      console.log('No current question in session, creating placeholder...');
      // Create a placeholder question object
      currentQuestion = {
        id: questionId,
        question: 'Unknown question',
        options: []
      };
    }
    
    // Create the attempt object
    const attempt = {
      questionId,
      questionText: currentQuestion.question,
      selectedOptionId,
      isCorrect,
      timeSpentMs,
      imageUrl: currentQuestion.imageUrl,
      correctOptionId: currentQuestion.options.find(opt => opt.isCorrect)?.id || questionId
    };
    
    // Update the session
    session.attempts.push(attempt);
    session.questionCount++;
    
    if (isCorrect) {
      session.score++;
    }
    
    session.lastUpdated = new Date();
    session.currentQuestion = undefined; // Clear the current question
    
    // Save the updated session
    sessions.set(sessionId, session);
    
    // Also update the database record
    try {
      const quizResult = await QuizResult.findOne({ quizId: sessionId });
      
      if (quizResult) {
        // Add the attempt to the questionAttempts array
        quizResult.questionAttempts.push({
          questionId,
          questionText: currentQuestion.question,
          correctCountryId: new mongoose.Types.ObjectId(attempt.correctOptionId),
          selectedCountryId: selectedOptionId ? new mongoose.Types.ObjectId(selectedOptionId) : null,
          isCorrect,
          timeSpentMs,
          imageUrl: currentQuestion.imageUrl
        });
        
        // Update totalScore if the answer was correct
        if (isCorrect) {
          quizResult.totalScore = (quizResult.totalScore || 0) + 1;
        }
        
        // Update totalQuestions
        quizResult.totalQuestions = (quizResult.totalQuestions || 0) + 1;
        
        // Update totalTimeSpentMs
        quizResult.totalTimeSpentMs = (quizResult.totalTimeSpentMs || 0) + timeSpentMs;
        
        await quizResult.save();
        console.log(`Updated quiz result in database for session ${sessionId}`);
      } else {
        console.log(`Creating new quiz result in database for session ${sessionId}`);
        // Create a new quiz result
        const newQuizResult = new QuizResult({
          quizId: sessionId,
          type: quizType,
          userName: 'Anonymous',
          questionAttempts: [{
            questionId,
            questionText: currentQuestion.question,
            correctCountryId: new mongoose.Types.ObjectId(attempt.correctOptionId),
            selectedCountryId: selectedOptionId ? new mongoose.Types.ObjectId(selectedOptionId) : null,
            isCorrect,
            timeSpentMs,
            imageUrl: currentQuestion.imageUrl
          }],
          totalScore: isCorrect ? 1 : 0,
          totalQuestions: 1,
          totalTimeSpentMs: timeSpentMs
        });
        
        await newQuizResult.save();
      }
    } catch (dbError) {
      console.error('Error updating quiz result in database:', dbError);
      // Continue anyway, the in-memory session is updated
    }
    
    return res.json({
      success: true,
      score: session.score,
      questionCount: session.questionCount
    });
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
      error: error.message
    });
  }
};

/**
 * Complete a quiz session
 * @route POST /api/quiz-sessions/:sessionId/complete
 */
export const completeQuizSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { type, questionAttempts } = req.body;
    
    // Get the session
    const session = sessions.get(sessionId);
    
    if (!session && !questionAttempts) {
      return res.status(404).json({
        success: false,
        message: 'Session not found and no question attempts provided'
      });
    }
    
    // Get the quiz result from the database
    let quizResult = await QuizResult.findOne({ quizId: sessionId });
    
    if (!quizResult) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }
    
    // If question attempts are provided, use them to update the quiz result
    if (questionAttempts && Array.isArray(questionAttempts)) {
      quizResult.questionAttempts = questionAttempts.map(attempt => ({
        questionId: attempt.questionId,
        questionText: attempt.questionText,
        correctCountryId: new mongoose.Types.ObjectId(attempt.correctOptionId),
        selectedCountryId: attempt.selectedOptionId ? new mongoose.Types.ObjectId(attempt.selectedOptionId) : null,
        isCorrect: attempt.isCorrect,
        timeSpentMs: attempt.timeSpentMs,
        imageUrl: attempt.imageUrl
      }));
      
      quizResult.totalScore = questionAttempts.filter(a => a.isCorrect).length;
      quizResult.totalQuestions = questionAttempts.length;
      quizResult.totalTimeSpentMs = questionAttempts.reduce((total, a) => total + a.timeSpentMs, 0);
    } else if (session) {
      // Use the session data to update the quiz result
      quizResult.totalScore = session.score;
      quizResult.totalQuestions = session.questionCount;
      quizResult.totalTimeSpentMs = session.attempts.reduce((total, a) => total + a.timeSpentMs, 0);
      
      // Update question attempts if needed
      if (session.attempts.length > quizResult.questionAttempts.length) {
        quizResult.questionAttempts = session.attempts.map(attempt => ({
          questionId: attempt.questionId,
          questionText: attempt.questionText,
          correctCountryId: new mongoose.Types.ObjectId(attempt.correctOptionId),
          selectedCountryId: attempt.selectedOptionId ? new mongoose.Types.ObjectId(attempt.selectedOptionId) : null,
          isCorrect: attempt.isCorrect,
          timeSpentMs: attempt.timeSpentMs,
          imageUrl: attempt.imageUrl
        }));
      }
    }
    
    // Mark the quiz as completed
    quizResult.isCompleted = true;
    quizResult.completedAt = new Date();
    
    await quizResult.save();
    
    // Clear the session from memory
    sessions.delete(sessionId);
    
    return res.json({
      success: true,
      quizId: quizResult.quizId,
      message: 'Quiz completed successfully'
    });
  } catch (error: any) {
    console.error('Error completing quiz session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete quiz session',
      error: error.message
    });
  }
};

// Helper functions to get random questions for each quiz type

async function getRandomFlagQuestion(filters?: QuizFilters) {
  let query: any = { code: { $exists: true, $ne: null } };  // Ensure we only get countries with valid codes
  
  // Apply filters if provided
  if (filters) {
    if (filters.continent && filters.continent !== 'all') {
      query.continent = filters.continent;
    }
    
    if (filters.in_geoguessr) {
      query.in_geoguessr = true;
    }
  }
  
  // Get random countries for options
  const countries = await Country.aggregate([
    { $match: query },
    { $sample: { size: 4 } }
  ]);
  
  if (!countries || countries.length === 0) {
    throw new Error('No countries found with the specified filters');
  }
  
  // Select one country as the correct answer
  const correctIndex = Math.floor(Math.random() * countries.length);
  const correctCountry = countries[correctIndex];
  
  // Create options
  const options = countries.map((country, index) => ({
    id: country._id.toString(),
    text: country.name,
    isCorrect: index === correctIndex
  }));
  
  // Construct the flag URL based on the country code
  const flagUrl = correctCountry.code 
    ? `https://flagcdn.com/w320/${correctCountry.code.toLowerCase()}.png` 
    : undefined;
  
  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: 'Which country does this flag belong to?',
    imageUrl: flagUrl,
    options
  };
}

async function getRandomCapitalQuestion(filters?: QuizFilters) {
  let query: any = { capital: { $exists: true, $ne: '' } };
  
  // Apply filters if provided
  if (filters) {
    if (filters.continent && filters.continent !== 'all') {
      query.continent = filters.continent;
    }
    
    if (filters.in_geoguessr) {
      query.in_geoguessr = true;
    }
  }
  
  // Get random countries for options
  const countries = await Country.aggregate([
    { $match: query },
    { $sample: { size: 4 } }
  ]);
  
  // Select one country as the correct answer
  const correctIndex = Math.floor(Math.random() * countries.length);
  const correctCountry = countries[correctIndex];
  
  // Create options
  const options = countries.map((country, index) => ({
    id: country._id.toString(),
    text: country.capital,
    isCorrect: index === correctIndex
  }));
  
  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: `What is the capital of ${correctCountry.name}?`,
    options
  };
}

async function getRandomBollardQuestion(filters?: QuizFilters) {
  // Build the aggregation pipeline based on filters
  const pipeline: any[] = [];
  
  // Add continent filter if specified
  if (filters?.continent && filters.continent !== 'all') {
    pipeline.push({
      $lookup: {
        from: 'countries',
        localField: 'countries',
        foreignField: '_id',
        as: 'countryDetails'
      }
    });
    pipeline.push({
      $match: {
        'countryDetails.continent': filters.continent
      }
    });
  }
  
  // Add GeoGuessr filter if specified
  if (filters?.in_geoguessr) {
    if (!pipeline.length) {
      pipeline.push({
        $lookup: {
          from: 'countries',
          localField: 'countries',
          foreignField: '_id',
          as: 'countryDetails'
        }
      });
    }
    pipeline.push({
      $match: {
        'countryDetails.in_geoguessr': true
      }
    });
  }
  
  // Add random sampling
  pipeline.push({ $sample: { size: 1 } });
  
  // Execute the query
  const bollards = await Bollard.aggregate(pipeline)
    .lookup({
      from: 'countries',
      localField: 'countries',
      foreignField: '_id',
      as: 'countryDetails'
    });
  
  if (!bollards.length) {
    throw new Error('No bollards found matching the criteria');
  }
  
  const bollard = bollards[0];
  
  // Get the countries associated with this bollard
  const correctCountryIds = bollard.countries.map((id: mongoose.Types.ObjectId) => id.toString());
  
  // If there are multiple correct countries, randomly select just one
  let selectedCorrectCountry;
  if (bollard.countryDetails.length > 0) {
    // Randomly select one correct country
    const randomIndex = Math.floor(Math.random() * bollard.countryDetails.length);
    selectedCorrectCountry = bollard.countryDetails[randomIndex];
  } else {
    throw new Error('No country details found for this bollard');
  }
  
  // Get additional random countries for options (we need 3 more to have 4 total)
  const additionalCountries = await Country.aggregate([
    { $match: { _id: { $nin: bollard.countries } } },
    { $sample: { size: 3 } }
  ]);
  
  // Create an array with exactly 4 options: 1 correct + 3 incorrect
  const allCountries = [
    selectedCorrectCountry,
    ...additionalCountries
  ];
  
  // Shuffle the countries
  for (let i = allCountries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCountries[i], allCountries[j]] = [allCountries[j], allCountries[i]];
  }
  
  // Create options
  const options = allCountries.map(country => ({
    id: country._id.toString(),
    text: country.name,
    isCorrect: country._id.toString() === selectedCorrectCountry._id.toString()
  }));
  
  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: 'In which country can you find this bollard?',
    imageUrl: bollard.imageUrl,
    options
  };
}

export const getQuizResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quizId = req.params.quizId;
    console.log('Fetching quiz result for ID:', quizId);
    
    const quizResult = await QuizResult.findOne({ quizId })
      .populate<{ questionAttempts: PopulatedQuestionAttempt[] }>('questionAttempts.correctCountryId', 'name')
      .populate<{ questionAttempts: PopulatedQuestionAttempt[] }>('questionAttempts.selectedCountryId', 'name');
    
    console.log('Found quiz result:', quizResult);
    
    if (!quizResult) {
      console.log('Quiz result not found for ID:', quizId);
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }

    // Transform the response data
    const responseData = {
      success: true,
      result: {
        quizId: quizResult.quizId,
        userName: quizResult.userName,
        type: quizResult.type,
        score: quizResult.totalScore,
        total: quizResult.totalQuestions,
        totalTimeSpentMs: quizResult.totalTimeSpentMs,
        isCompleted: quizResult.isCompleted,
        createdAt: quizResult.createdAt,
        completedAt: quizResult.completedAt,
        questionAttempts: quizResult.questionAttempts.map(attempt => {
          // Get country names from populated fields
          const correctCountryName = attempt.correctCountryId && typeof attempt.correctCountryId === 'object' 
            ? attempt.correctCountryId.name 
            : undefined;
          
          const selectedCountryName = attempt.selectedCountryId && typeof attempt.selectedCountryId === 'object' 
            ? attempt.selectedCountryId.name 
            : undefined;
          
          return {
            questionId: attempt.questionId,
            questionText: attempt.questionText,
            correctOptionId: attempt.correctCountryId?._id?.toString() || '',
            selectedOptionId: attempt.selectedCountryId?._id?.toString() || null,
            isCorrect: attempt.isCorrect,
            timeSpentMs: attempt.timeSpentMs,
            imageUrl: attempt.imageUrl,
            // Include country names
            correctCountryName,
            selectedCountryName
          };
        })
      }
    };

    return res.json(responseData);
  } catch (error: any) {
    console.error('Error fetching quiz result:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz result',
      error: error.message
    });
  }
}; 