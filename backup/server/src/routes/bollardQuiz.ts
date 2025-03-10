import express from 'express';
import * as bollardQuizController from '../controllers/bollardQuizController';

const router = express.Router();

router.get('/session/:sessionId', bollardQuizController.getSession);
router.get('/question', bollardQuizController.getQuestion);
router.post('/answer', bollardQuizController.submitAnswer);

export default router; 