import express from 'express';
import { uploadLicensePlate, createLicensePlate, getGeoGuessrCountries, getAllLicensePlates, deleteLicensePlate, getLicensePlatesByCountry, getLicensePlateCount, updateLicensePlate } from '../controllers/licensePlateController';
import { requireApiKey } from '../middleware/apiKeyMiddleware';

const router = express.Router();

// Protected admin routes
router.post('/upload', requireApiKey, uploadLicensePlate, createLicensePlate);
router.put('/:id', requireApiKey, uploadLicensePlate, updateLicensePlate);
router.delete('/:id', requireApiKey, deleteLicensePlate);

// Public routes
router.get('/', getAllLicensePlates);
router.get('/count', getLicensePlateCount);
router.get('/countries', getGeoGuessrCountries);
router.get('/country/:countryId', getLicensePlatesByCountry);

export default router;