import express from 'express';
import { 
  getQuizzes, 
  getQuizById, 
  submitQuizAnswer, 
  getCapitalsQuiz, 
  getFilteredCapitalsQuiz, 
  getContinents,
  getFlagsQuiz,
  getFilteredFlagsQuiz
} from '../controllers/quizController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Define specific routes first
router.get('/', getQuizzes);
router.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint is working' });
});
router.get('/continents', getContinents);
router.get('/capitals', getCapitalsQuiz);
router.get('/capitals/filtered', getFilteredCapitalsQuiz);
router.get('/flags', getFlagsQuiz);
router.get('/flags/filtered', getFilteredFlagsQuiz);

// Define parameter routes last
router.get('/:id', getQuizById);
router.post('/:id/submit', protect, submitQuizAnswer);

export default router;
