import express from 'express';
import userRoutes from './userRoutes';
import quizResultRoutes from './quizResultRoutes';
import countryRoutes from './countryRoutes';
import unifiedQuizRoutes from './unifiedQuizRoutes';
import bollardRoutes from './bollardRoutes';
import licensePlateRoutes from './licensePlateRoutes';
import roadSignRoutes from './roadSignRoutes';
import languageRoutes from './languageRoutes';
import gameRoutes from './gameRoutes';
import adminAuthRoutes from './adminAuthRoutes';
import googleCarRoutes from './googleCarRoutes';
import guessRoutes from './guessRoutes';

const router = express.Router();

// Register routes
router.use('/users', userRoutes);
router.use('/quiz-results', quizResultRoutes);
router.use('/countries', countryRoutes);
router.use('/game', gameRoutes);
router.use('/bollards', bollardRoutes);
router.use('/licenseplates', licensePlateRoutes);
router.use('/roadsigns', roadSignRoutes);
router.use('/languages', languageRoutes);
router.use('/guesses', guessRoutes);

// Register unified quiz routes
router.use('/', unifiedQuizRoutes);

// Admin Auth Routes
router.use('/admin-auth', adminAuthRoutes);

// Add Google Car routes
router.use('/google-cars', googleCarRoutes);

export default router;
