import express, { RequestHandler } from 'express';
import {
  initQuizSession,
  recordQuestionAttempt,
  completeQuizSession,
  getQuizAnalytics,
  getQuizResult,
  getNextQuestion
} from '../controllers/quizResultController';

const router = express.Router();

// Initialize a new quiz session
router.post('/', initQuizSession as RequestHandler);

// Record a question attempt
router.post('/:quizId/submit-answer', recordQuestionAttempt as RequestHandler);

// Complete a quiz session
router.post('/:quizId/complete', completeQuizSession as RequestHandler);

// Get quiz analytics (this would be protected in production)
router.get('/analytics', getQuizAnalytics as RequestHandler);

// Get the next question for a quiz
router.get('/:quizId/next-question', getNextQuestion as RequestHandler);

// Get a specific quiz result
router.get('/:quizId', getQuizResult as RequestHandler);

export default router;
