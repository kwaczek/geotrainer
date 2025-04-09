import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import GoogleCar from '../models/GoogleCar'; // Changed import
import Country from '../models/Country'; // Keep Country import for populating
import mongoose from 'mongoose';
import { getGeoGuessrCountries as fetchGeoGuessrCountries } from './bollardController'; // Import the shared function

// Configure multer for file upload - Adjusted destination
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/google-cars/'); // Changed destination folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Renamed export
export const uploadGoogleCar = upload.single('image');

// Renamed function and adapted model/paths
export const createGoogleCar = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No image file provided' });
            return;
        }

        const { description, countries, googleMapsUrl } = req.body;

        if (!description || !countries || !googleMapsUrl) {
            res.status(400).json({ message: 'Description, countries, and Google Maps URL are required' });
            return;
        }

        const googleCar = new GoogleCar({ // Changed model
            imageUrl: `/uploads/google-cars/${req.file.filename}`, // Changed path
            description,
            googleMapsUrl,
            countries: JSON.parse(countries)
        });

        await googleCar.save();
        res.status(201).json(googleCar);
    } catch (error) {
        console.error('Error creating google car:', error); // Changed message
        res.status(500).json({ message: 'Error creating google car' }); // Changed message
    }
};

// Re-exporting the shared function for clarity if needed, or can be used directly from bollardController import
export const getGeoGuessrCountries = fetchGeoGuessrCountries;


// Renamed function and adapted model
export const getAllGoogleCars = async (req: Request, res: Response): Promise<void> => {
    try {
        const googleCars = await GoogleCar.find() // Changed model
            .populate('countries', 'name code')
            .sort('-createdAt');
        res.json(googleCars);
    } catch (error) {
        console.error('Error fetching google cars:', error); // Changed message
        res.status(500).json({ message: 'Error fetching google cars' }); // Changed message
    }
};

// Renamed function and adapted model/paths
export const deleteGoogleCar = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Find the google car first to get the image URL
        const googleCar = await GoogleCar.findById(id); // Changed model
        if (!googleCar) {
            res.status(404).json({ message: 'Google Car not found' }); // Changed message
            return;
        }

        // Extract the filename from the imageUrl
        const imagePath = path.join(__dirname, '../../', googleCar.imageUrl); // Path should be correct relative to controller

        // Delete the google car from the database
        await GoogleCar.findByIdAndDelete(id); // Changed model

        // Delete the image file if it exists
        if (existsSync(imagePath)) {
             // Check if file exists before attempting deletion
            try {
                await fs.unlink(imagePath);
            } catch (unlinkError) {
                // Log error if deletion fails but continue - DB entry is already removed
                console.error(`Failed to delete image file ${imagePath}:`, unlinkError);
            }
        }


        res.json({ message: 'Google Car deleted successfully' }); // Changed message
    } catch (error) {
        console.error('Error deleting google car:', error); // Changed message
        res.status(500).json({ message: 'Error deleting google car' }); // Changed message
    }
};

// Note: getBollardsByCountry and getBollardCount are omitted as they weren't explicitly requested for Google Cars yet.
// They could be added later by adapting the logic similarly. 