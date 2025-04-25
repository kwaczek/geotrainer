import express from 'express';
import {
    uploadLanguage,         // Multer upload middleware for language image
    createLanguage,         // Controller function to create a language entry
    getGeoGuessrCountries,  // Controller function to get all countries (reusable)
    getAllLanguages,        // Controller function to get all language entries
    deleteLanguage,         // Controller function to delete a language entry
    getLanguagesByCountry,  // Controller function to get languages for a specific country
    getLanguageCount,       // Controller function to get the count of language entries
    updateLanguage          // Controller function to update a language entry
} from '../controllers/languageController';
import { requireApiKey } from '../middleware/apiKeyMiddleware'; // API key authentication middleware

const router = express.Router();

// --- Protected Admin Routes ---
// POST /api/languages/upload - Uploads an image and creates a new language entry
router.post('/upload', requireApiKey, uploadLanguage, createLanguage);

// PUT /api/languages/:id - Updates a specific language entry by its ID
router.put('/:id', requireApiKey, uploadLanguage, updateLanguage);

// DELETE /api/languages/:id - Deletes a specific language entry by its ID
router.delete('/:id', requireApiKey, deleteLanguage);

// --- Public Routes ---
// GET /api/languages - Gets all language entries (with populated country data)
router.get('/', getAllLanguages);

// GET /api/languages/count - Gets the total count of language entries (can be filtered by query params)
router.get('/count', getLanguageCount);

// GET /api/languages/countries - Gets a list of all available countries (for the admin dropdown)
// Reusing the function from the controller as it just fetches countries
router.get('/countries', getGeoGuessrCountries);

// GET /api/languages/country/:countryId - Gets language entries associated with a specific country ID
router.get('/country/:countryId', getLanguagesByCountry);

export default router;