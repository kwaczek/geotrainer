import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import QuizResult, { QuizType } from '../models/QuizResult';
import Country from '../models/Country';
import Bollard from '../models/Bollard';
import LicensePlate from '../models/LicensePlate';

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
    if (!type || ![QuizType.FLAGS, QuizType.CAPITALS, QuizType.BOLLARDS, QuizType.LICENSEPLATES].includes(type.toLowerCase() as QuizType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz type. Must be either "flags", "capitals", "bollards", or "licenseplates"'
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
    const previousQuestionIds = req.query.previousQuestionIds 
      ? JSON.parse(req.query.previousQuestionIds as string) as string[] 
      : [];
    const previousEntityIds = req.query.previousEntityIds
      ? JSON.parse(req.query.previousEntityIds as string) as string[]
      : [];
    
    console.log(`Getting next question for ${quizType} quiz, sessionId: ${sessionId}, filters:`, filters);
    console.log(`Excluding previous question IDs (${previousQuestionIds.length}):`, previousQuestionIds);
    console.log(`Excluding previous entity IDs (${previousEntityIds.length}):`, previousEntityIds);
    
    // Validate quiz type
    if (!quizType || ![QuizType.FLAGS, QuizType.CAPITALS, QuizType.BOLLARDS, QuizType.LICENSEPLATES].includes(quizType.toLowerCase() as QuizType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz type. Must be either "flags", "capitals", "bollards", or "licenseplates"'
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
          question = await getRandomFlagQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.CAPITALS:
          question = await getRandomCapitalQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.BOLLARDS:
          question = await getRandomBollardQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.LICENSEPLATES:
          question = await getRandomLicensePlateQuestion(session.filters, previousEntityIds);
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
    const { sessionId, questionId, selectedOptionId, isCorrect, timeSpentMs, userCustomInput } = req.body;
    
    console.log('Received answer submission:', {
      quizType,
      sessionId,
      questionId,
      selectedOptionId,
      isCorrect,
      timeSpentMs,
      userCustomInput
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
    
    // Create an attempt object to store in the session
    const attempt = {
      questionId,
      correctOptionId: selectedOptionId,
      selectedOptionId,
      isCorrect,
      timeSpentMs,
      userCustomInput
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
          imageUrl: currentQuestion.imageUrl,
          userCustomInput
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
            imageUrl: currentQuestion.imageUrl,
            userCustomInput
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

async function getRandomFlagQuestion(filters?: QuizFilters, previousEntityIds: string[] = []) {
  let baseQuery: any = { code: { $exists: true, $ne: null } };  // Ensure we only get countries with valid codes
  
  // Apply filters if provided
  if (filters) {
    if (filters.continent && filters.continent !== 'all') {
      baseQuery.continent = filters.continent;
    }
    
    if (filters.in_geoguessr) {
      baseQuery.in_geoguessr = true;
    }
  }
  
  // Create a query for the correct answer that excludes previously seen entities
  let correctAnswerQuery = { ...baseQuery };
  
  // Filter out countries that were used in previous questions ONLY for the correct answer
  if (previousEntityIds.length > 0) {
    // Convert string IDs to ObjectId for MongoDB comparison
    const objectIds = previousEntityIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return id; // If conversion fails, keep the string (for cases like auto-generated IDs)
      }
    });
    correctAnswerQuery._id = { $nin: objectIds };
  }
  
  // Get a random country for the correct answer that hasn't been used before
  const correctCountryCandidates = await Country.aggregate([
    { $match: correctAnswerQuery },
    { $sample: { size: 1 } }
  ]);
  
  // If no countries available with exclusion filter, try without it
  let correctCountry;
  if (!correctCountryCandidates || correctCountryCandidates.length === 0) {
    if (previousEntityIds.length > 0) {
      console.log('No countries found with exclusion filter for correct answer, retrying without excluding previous countries');
      const fallbackCountries = await Country.aggregate([
        { $match: baseQuery },
        { $sample: { size: 1 } }
      ]);
      
      if (!fallbackCountries || fallbackCountries.length === 0) {
        throw new Error('No countries found with the specified filters');
      }
      
      correctCountry = fallbackCountries[0];
    } else {
      throw new Error('No countries found with the specified filters');
    }
  } else {
    correctCountry = correctCountryCandidates[0];
  }
  
  // Now get random countries for incorrect options - don't exclude previous entity IDs
  // but do exclude the current correct answer
  const incorrectOptionsQuery = { 
    ...baseQuery,
    _id: { $ne: correctCountry._id } // Only exclude the current correct answer
  };
  
  const incorrectCountries = await Country.aggregate([
    { $match: incorrectOptionsQuery },
    { $sample: { size: 3 } }
  ]);
  
  // If we couldn't find enough incorrect options, try with fewer filters
  if (incorrectCountries.length < 3) {
    console.log(`Only found ${incorrectCountries.length} incorrect countries with filters, getting more with relaxed filters`);
    
    // Simplified query that just excludes the correct answer
    const fallbackQuery: any = { 
      code: { $exists: true, $ne: null },
      _id: { $ne: correctCountry._id }
    };
    
    // Keep any in_geoguessr filter if it was specified
    if (filters?.in_geoguessr) {
      fallbackQuery.in_geoguessr = true;
    }
    
    const additionalCountries = await Country.aggregate([
      { $match: fallbackQuery },
      { $sample: { size: 3 - incorrectCountries.length } }
    ]);
    
    incorrectCountries.push(...additionalCountries);
  }
  
  // Combine correct and incorrect options
  const allOptions = [
    {
      id: correctCountry._id.toString(),
      text: correctCountry.name,
      isCorrect: true
    },
    ...incorrectCountries.map(country => ({
      id: country._id.toString(),
      text: country.name,
      isCorrect: false
    }))
  ];
  
  // Shuffle the options
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }
  
  // Construct the flag URL based on the country code
  const flagUrl = correctCountry.code 
    ? `https://flagcdn.com/w320/${correctCountry.code.toLowerCase()}.png` 
    : undefined;
  
  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: 'Which country does this flag belong to?',
    imageUrl: flagUrl,
    options: allOptions
  };
}

async function getRandomCapitalQuestion(filters?: QuizFilters, previousEntityIds: string[] = []) {
  let baseQuery: any = { capital: { $exists: true, $ne: '' } };
  
  // Apply filters if provided
  if (filters) {
    if (filters.continent && filters.continent !== 'all') {
      baseQuery.continent = filters.continent;
    }
    
    if (filters.in_geoguessr) {
      baseQuery.in_geoguessr = true;
    }
  }
  
  // Create a query for the correct answer that excludes previously seen entities
  let correctAnswerQuery = { ...baseQuery };
  
  // Filter out countries that were used in previous questions ONLY for the correct answer
  if (previousEntityIds.length > 0) {
    // Convert string IDs to ObjectId for MongoDB comparison
    const objectIds = previousEntityIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return id; // If conversion fails, keep the string (for cases like auto-generated IDs)
      }
    });
    correctAnswerQuery._id = { $nin: objectIds };
  }
  
  // Get a random country for the correct answer that hasn't been used before
  const correctCountryCandidates = await Country.aggregate([
    { $match: correctAnswerQuery },
    { $sample: { size: 1 } }
  ]);
  
  // If no countries available with exclusion filter, try without it
  let correctCountry;
  if (!correctCountryCandidates || correctCountryCandidates.length === 0) {
    if (previousEntityIds.length > 0) {
      console.log('No countries found with exclusion filter for correct answer, retrying without excluding previous countries');
      const fallbackCountries = await Country.aggregate([
        { $match: baseQuery },
        { $sample: { size: 1 } }
      ]);
      
      if (!fallbackCountries || fallbackCountries.length === 0) {
        throw new Error('No countries found with the specified filters');
      }
      
      correctCountry = fallbackCountries[0];
    } else {
      throw new Error('No countries found with the specified filters');
    }
  } else {
    correctCountry = correctCountryCandidates[0];
  }
  
  // Now get random countries for incorrect options - don't exclude previous entity IDs
  // but do exclude the current correct answer
  const incorrectOptionsQuery = { 
    ...baseQuery,
    _id: { $ne: correctCountry._id } // Only exclude the current correct answer
  };
  
  const incorrectCountries = await Country.aggregate([
    { $match: incorrectOptionsQuery },
    { $sample: { size: 3 } }
  ]);
  
  // If we couldn't find enough incorrect options, try with fewer filters
  if (incorrectCountries.length < 3) {
    console.log(`Only found ${incorrectCountries.length} incorrect countries with filters, getting more with relaxed filters`);
    
    // Simplified query that just excludes the correct answer
    const fallbackQuery: any = { 
      capital: { $exists: true, $ne: '' },
      _id: { $ne: correctCountry._id }
    };
    
    // Keep any in_geoguessr filter if it was specified
    if (filters?.in_geoguessr) {
      fallbackQuery.in_geoguessr = true;
    }
    
    const additionalCountries = await Country.aggregate([
      { $match: fallbackQuery },
      { $sample: { size: 3 - incorrectCountries.length } }
    ]);
    
    incorrectCountries.push(...additionalCountries);
  }
  
  // Combine correct and incorrect options
  const allOptions = [
    {
      id: correctCountry._id.toString(),
      text: correctCountry.capital,
      isCorrect: true
    },
    ...incorrectCountries.map(country => ({
      id: country._id.toString(),
      text: country.capital,
      isCorrect: false
    }))
  ];
  
  // Shuffle the options
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }
  
  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: `What is the capital of ${correctCountry.name}?`,
    options: allOptions
  };
}

async function getRandomBollardQuestion(filters?: QuizFilters, previousEntityIds: string[] = []) {
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
    if (!pipeline.some(stage => stage.$lookup?.as === 'countryDetails')) {
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
  
  // Filter out bollards that were used in previous questions
  if (previousEntityIds.length > 0) {
    console.log(`Attempting to exclude ${previousEntityIds.length} previous bollard entities`);
    // Convert string IDs to ObjectId for MongoDB comparison
    const objectIds = previousEntityIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return id; // If conversion fails, keep the string
      }
    });
    
    pipeline.push({
      $match: {
        _id: { $nin: objectIds }
      }
    });
  }
  
  // Add random sampling
  pipeline.push({ $sample: { size: 1 } });
  
  // Execute the query
  let bollards = await Bollard.aggregate(pipeline)
    .lookup({
      from: 'countries',
      localField: 'countries',
      foreignField: '_id',
      as: 'countryDetails'
    });
  
  // If no bollards found with the filters + previous exclusion, 
  // try again without excluding previous questions
  if (!bollards.length && previousEntityIds.length > 0) {
    console.log('No bollards found with exclusion filter, retrying without excluding previous bollards');
    
    // Rebuild the pipeline without the exclusion
    const retryPipeline = pipeline.filter(stage => !stage.$match?._id);
    retryPipeline.push({ $sample: { size: 1 } });
    
    bollards = await Bollard.aggregate(retryPipeline)
      .lookup({
        from: 'countries',
        localField: 'countries',
        foreignField: '_id',
        as: 'countryDetails'
      });
  }
  
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
  
  // For write mode, we need to track all correct countries, not just one
  const allCorrectCountries = bollard.countryDetails.map((country: any) => ({
    id: country._id.toString(),
    text: country.name,
    isCorrect: true
  }));
  
  // Build a filter for additional countries that matches the same criteria
  const additionalCountriesFilter: any = { _id: { $nin: bollard.countries } };
  
  // Apply the same continent filter to additional countries
  if (filters?.continent && filters.continent !== 'all') {
    additionalCountriesFilter.continent = filters.continent;
  }
  
  // Apply the same GeoGuessr filter to additional countries
  if (filters?.in_geoguessr) {
    additionalCountriesFilter.in_geoguessr = true;
  }
  
  // Get additional random countries for options (we need 3 more to have 4 total)
  const additionalCountries = await Country.aggregate([
    { $match: additionalCountriesFilter },
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
  
  // Create options, using the correct countries for the options display
  const options = allCountries.map(country => ({
    id: country._id.toString(),
    text: country.name,
    isCorrect: country._id.toString() === selectedCorrectCountry._id.toString()
  }));
  
  // Add metadata for write mode - store all correct country names
  // This will be used by the client to validate write mode answers
  const allCorrectCountryNames = bollard.countryDetails.map((country: any) => country.name);
  
  // Store the actual bollard ID in metadata
  const bollardId = bollard._id.toString();
  console.log(`Using bollard with ID: ${bollardId}`);
  
  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: 'In which country can you find this bollard?',
    imageUrl: bollard.imageUrl,
    options,
    metadata: {
      allCorrectCountryNames,
      bollardId // Include the actual bollard ID in metadata for tracking
    }
  };
}

async function getRandomLicensePlateQuestion(filters?: QuizFilters, previousEntityIds: string[] = []) {
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
    if (!pipeline.some(stage => stage.$lookup?.as === 'countryDetails')) {
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
  
  // Filter out license plates that were used in previous questions
  if (previousEntityIds.length > 0) {
    console.log(`Attempting to exclude ${previousEntityIds.length} previous license plate entities`);
    // Convert string IDs to ObjectId for MongoDB comparison
    const objectIds = previousEntityIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return id; // If conversion fails, keep the string
      }
    });
    
    pipeline.push({
      $match: {
        _id: { $nin: objectIds }
      }
    });
  }
  
  // Add random sampling
  pipeline.push({ $sample: { size: 1 } });
  
  // Execute the query
  let licensePlates = await LicensePlate.aggregate(pipeline)
    .lookup({
      from: 'countries',
      localField: 'countries',
      foreignField: '_id',
      as: 'countryDetails'
    });
  
  // If no license plates found with the filters + previous exclusion, 
  // try again without excluding previous questions
  if (!licensePlates.length && previousEntityIds.length > 0) {
    console.log('No license plates found with exclusion filter, retrying without excluding previous license plates');
    
    // Rebuild the pipeline without the exclusion
    const retryPipeline = pipeline.filter(stage => !stage.$match?._id);
    retryPipeline.push({ $sample: { size: 1 } });
    
    licensePlates = await LicensePlate.aggregate(retryPipeline)
      .lookup({
        from: 'countries',
        localField: 'countries',
        foreignField: '_id',
        as: 'countryDetails'
      });
  }
  
  if (!licensePlates.length) {
    throw new Error('No license plates found matching the criteria');
  }
  
  const licensePlate = licensePlates[0];
  
  // Get the countries associated with this license plate
  const correctCountryIds = licensePlate.countries.map((id: mongoose.Types.ObjectId) => id.toString());
  
  // If there are multiple correct countries, randomly select just one
  let selectedCorrectCountry;
  if (licensePlate.countryDetails.length > 0) {
    // Randomly select one correct country
    const randomIndex = Math.floor(Math.random() * licensePlate.countryDetails.length);
    selectedCorrectCountry = licensePlate.countryDetails[randomIndex];
  } else {
    throw new Error('No country details found for this license plate');
  }
  
  // For write mode, we need to track all correct countries, not just one
  const allCorrectCountries = licensePlate.countryDetails.map((country: any) => ({
    id: country._id.toString(),
    text: country.name,
    isCorrect: true
  }));
  
  // Build a filter for additional countries that matches the same criteria
  const additionalCountriesFilter: any = { _id: { $nin: licensePlate.countries } };
  
  // Apply the same continent filter to additional countries
  if (filters?.continent && filters.continent !== 'all') {
    additionalCountriesFilter.continent = filters.continent;
  }
  
  // Apply the same GeoGuessr filter to additional countries
  if (filters?.in_geoguessr) {
    additionalCountriesFilter.in_geoguessr = true;
  }
  
  // Get additional random countries for options (we need 3 more to have 4 total)
  const additionalCountries = await Country.aggregate([
    { $match: additionalCountriesFilter },
    { $sample: { size: 3 } }
  ]);
  
  // If we couldn't find enough countries with the filters, fall back to countries without filters
  if (additionalCountries.length < 3) {
    console.log(`Warning: Could only find ${additionalCountries.length} additional countries with the specified filters. Falling back to countries without filters.`);
    const fallbackCountries = await Country.aggregate([
      { $match: { _id: { $nin: [...licensePlate.countries, ...additionalCountries.map(c => c._id)] } } },
      { $sample: { size: 3 - additionalCountries.length } }
    ]);
    additionalCountries.push(...fallbackCountries);
  }
  
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
  
  // Create options, using the correct countries for the options display
  const options = allCountries.map(country => ({
    id: country._id.toString(),
    text: country.name,
    isCorrect: country._id.toString() === selectedCorrectCountry._id.toString()
  }));
  
  // Add metadata for write mode - store all correct country names
  // This will be used by the client to validate write mode answers
  const allCorrectCountryNames = licensePlate.countryDetails.map((country: any) => country.name);
  
  // Store the actual license plate ID in metadata
  const licensePlateId = licensePlate._id.toString();
  console.log(`Using license plate with ID: ${licensePlateId}`);
  
  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: 'In which country can you find this license plate?',
    imageUrl: licensePlate.imageUrl,
    options,
    metadata: {
      allCorrectCountryNames,
      licensePlateId // Include the actual license plate ID in metadata for tracking
    }
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