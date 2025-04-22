import express from 'express';
import { uploadBollard, createBollard, getGeoGuessrCountries, getAllBollards, deleteBollard, getBollardsByCountry, getBollardCount, updateBollard } from '../controllers/bollardController';
import { requireApiKey } from '../middleware/apiKeyMiddleware';

const router = express.Router();

// Protected admin routes
router.post('/upload', requireApiKey, uploadBollard, createBollard);
router.put('/:id', requireApiKey, uploadBollard, updateBollard);
router.get('/countries', getGeoGuessrCountries);
router.get('/', getAllBollards);
router.delete('/:id', requireApiKey, deleteBollard);

// Public routes
router.get('/count', getBollardCount);
router.get('/country/:countryId', getBollardsByCountry);

export default router;
