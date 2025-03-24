import express from 'express';
import { uploadRoadSign, createRoadSign, getGeoGuessrCountries, getAllRoadSigns, deleteRoadSign, getRoadSignsByCountry, getRoadSignCount } from '../controllers/roadSignController';
import { requireApiKey } from '../middleware/apiKeyMiddleware';

const router = express.Router();

// Protected admin routes
router.post('/upload', requireApiKey, uploadRoadSign, createRoadSign);
router.get('/countries', getGeoGuessrCountries);
router.get('/', getAllRoadSigns);
router.delete('/:id', requireApiKey, deleteRoadSign);

// Public routes
router.get('/count', getRoadSignCount);
router.get('/country/:countryId', getRoadSignsByCountry);

export default router; 