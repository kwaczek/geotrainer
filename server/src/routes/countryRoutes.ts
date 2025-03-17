import express from 'express';
import * as countryController from '../controllers/countryController';
import { requireApiKey } from '../middleware/apiKeyMiddleware';

const router = express.Router();

// Public routes
// Get count of countries with optional filters
router.get('/count', countryController.getCountryCount);

// Get all countries
router.get('/', countryController.getAllCountries);

// Get all continents
router.get('/continents', countryController.getContinents);

// Get country by name - this must come before the ID route
router.get('/name/:name', countryController.getCountryByName);

// Get country by ID
router.get('/:id', countryController.getCountryById);

// Protected admin routes
router.post('/', requireApiKey, countryController.createCountry);
router.put('/:id', requireApiKey, countryController.updateCountry);
router.delete('/:id', requireApiKey, countryController.deleteCountry);

export default router;
