import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import QuizResult, { QuizType } from '../../models/QuizResult';
import { QuizSession, QuizFilters } from './types';

// In-memory session storage (in production, this should be in Redis or a database)
export const sessions = new Map<string, QuizSession>();

/**
 * Initialize a new quiz session
 * @route POST /api/quiz-sessions
 */
export const initQuizSession = async (req: Request, res: Response) => {
  try {
    const { type, userName, filters } = req.body;

    // Validate quiz type
    if (!type || ![QuizType.FLAGS, QuizType.CAPITALS, QuizType.BOLLARDS, QuizType.LICENSEPLATES, QuizType.ROADSIGNS, QuizType.LANGUAGES, QuizType.CARS, QuizType.POLES, QuizType.DOMAINS, QuizType.CURRENCIES].includes(type.toLowerCase() as QuizType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz type. Must be flags, capitals, bollards, licenseplates, roadsigns, languages, cars, poles, domains, or currencies'
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