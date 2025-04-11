import express from 'express';
import {
    uploadPole,
    createPole,
    getAllPoles,
    deletePole,
    getPolesByCountry,
    getPoleCount
} from '../controllers/poleController';
// Use apiKeyMiddleware for admin routes, similar to bollardRoutes
import { requireApiKey } from '../middleware/apiKeyMiddleware'; 

const router = express.Router();

// GET all poles (Publicly accessible or requires auth based on your needs)
// If it should be public for learning page, remove authenticate
router.get('/', getAllPoles); 

// GET poles for a specific country (Publicly accessible or requires auth)
router.get('/country/:countryId', getPolesByCountry);

// GET count of poles (Publicly accessible or requires auth)
router.get('/count', getPoleCount);

// --- Admin Routes (Protected by API Key) ---
// POST upload and create a new pole (Admin only)
router.post('/upload', requireApiKey, uploadPole, createPole);

// DELETE a pole by ID (Admin only)
router.delete('/:id', requireApiKey, deletePole);

export default router; 