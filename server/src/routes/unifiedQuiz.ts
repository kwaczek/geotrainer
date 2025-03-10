import express, { Request, Response } from 'express';
import * as unifiedQuizController from '../controllers/unifiedQuizController';

const router = express.Router();

// Quiz session routes
router.post('/quiz-sessions', (req: Request, res: Response) => {
  unifiedQuizController.initQuizSession(req, res);
});

router.get('/quiz-sessions/:sessionId', (req: Request, res: Response) => {
  unifiedQuizController.getQuizSession(req, res);
});

router.post('/quiz-sessions/:sessionId/complete', (req: Request, res: Response) => {
  unifiedQuizController.completeQuizSession(req, res);
});

// Quiz question routes
router.get('/quiz-questions/:quizType', (req: Request, res: Response) => {
  unifiedQuizController.getNextQuestion(req, res);
});

// Quiz answer routes
router.post('/quiz-answers/:quizType', (req: Request, res: Response) => {
  unifiedQuizController.submitAnswer(req, res);
});

export default router; 