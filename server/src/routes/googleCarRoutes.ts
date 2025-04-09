import express from 'express';
// Import the necessary controller functions for Google Cars
import { uploadGoogleCar, createGoogleCar, getAllGoogleCars, deleteGoogleCar, getGeoGuessrCountries } from '../controllers/googleCarController';
import { requireApiKey } from '../middleware/apiKeyMiddleware';

const router = express.Router();

// Protected admin routes for Google Cars
router.post('/upload', requireApiKey, uploadGoogleCar, createGoogleCar);
router.get('/', getAllGoogleCars);
router.delete('/:id', requireApiKey, deleteGoogleCar);

// Reuse the endpoint for fetching countries (assuming it's the same list for both)
router.get('/countries', getGeoGuessrCountries);

// Note: Public routes like /count or /country/:countryId are not included yet,
// as they were not part of the initial request for Google Cars.

export default router; 