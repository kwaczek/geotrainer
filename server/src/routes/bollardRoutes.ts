import express from 'express';
import { uploadBollard, createBollard, getGeoGuessrCountries, getAllBollards, deleteBollard, getBollardsByCountry } from '../controllers/bollardController';

const router = express.Router();

// Hidden admin routes - these should be protected in production
router.post('/upload', uploadBollard, createBollard);
router.get('/countries', getGeoGuessrCountries);
router.get('/', getAllBollards);
router.delete('/:id', deleteBollard);

// Public routes
router.get('/country/:countryId', getBollardsByCountry);

export default router;
