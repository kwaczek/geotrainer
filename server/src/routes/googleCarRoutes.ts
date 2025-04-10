import express from 'express';
// Import the necessary controller functions for Google Cars
import { uploadGoogleCar, createGoogleCar, getAllGoogleCars, deleteGoogleCar, getGeoGuessrCountries, getGoogleCarCount, getGoogleCarsByCountry } from '../controllers/googleCarController';
import { requireApiKey } from '../middleware/apiKeyMiddleware';

const router = express.Router();

// Protected admin routes for Google Cars
router.post('/upload', requireApiKey, uploadGoogleCar, createGoogleCar);
router.get('/', getAllGoogleCars);
router.delete('/:id', requireApiKey, deleteGoogleCar);

// Reuse the endpoint for fetching countries (assuming it's the same list for both)
router.get('/countries', getGeoGuessrCountries);

// Public route to get the count of google cars (supports filtering)
router.get('/count', getGoogleCarCount);

// Route to get Google Cars by country
router.get('/country/:countryId', getGoogleCarsByCountry);

export default router; 