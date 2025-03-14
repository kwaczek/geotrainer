import express from 'express';
import { uploadLicensePlate, createLicensePlate, getGeoGuessrCountries, getAllLicensePlates, deleteLicensePlate, getLicensePlatesByCountry } from '../controllers/licensePlateController';

const router = express.Router();

// Hidden admin routes - these should be protected in production
router.post('/upload', uploadLicensePlate, createLicensePlate);

router.get('/', getAllLicensePlates);
router.delete('/:id', deleteLicensePlate);

// Public routes
router.get('/countries', getGeoGuessrCountries);
router.get('/country/:countryId', getLicensePlatesByCountry);

export default router; 