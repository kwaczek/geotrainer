import express from 'express';
import * as countryController from '../controllers/countryController';

const router = express.Router();

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

export default router;
