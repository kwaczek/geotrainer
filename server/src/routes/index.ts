import express from 'express';
import userRoutes from './userRoutes';
import quizResultRoutes from './quizResultRoutes';
import countryRoutes from './countryRoutes';
import unifiedQuizRoutes from './unifiedQuiz';
import bollardRoutes from './bollardRoutes';

const router = express.Router();

// Register routes
router.use('/users', userRoutes);
router.use('/quiz-results', quizResultRoutes);
router.use('/countries', countryRoutes);
router.use('/bollards', bollardRoutes);

// Register unified quiz routes
router.use('/', unifiedQuizRoutes);

export default router;
