import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import GoogleCar from '../models/GoogleCar'; // Changed import
import Country from '../models/Country'; // Keep Country import for populating
import mongoose from 'mongoose';
import { getGeoGuessrCountries as fetchGeoGuessrCountries } from './bollardController'; // Import the shared function

// Ensure the upload directory exists
const uploadDir = path.resolve(__dirname, '../../uploads/google-cars'); // Resolve absolute path
if (!existsSync(uploadDir)) {
    try {
        mkdirSync(uploadDir, { recursive: true }); // Create directory if it doesn't exist
        console.log(`Created directory: ${uploadDir}`);
    } catch (error) {
        console.error(`Error creating directory ${uploadDir}:`, error);
        // Optionally handle the error, e.g., by preventing server start or logging severity
    }
}

// Configure multer for file upload - Adjusted destination
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Use the resolved absolute path
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

// Get count of google cars with optional filters
export const getGoogleCarCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { continent, in_geoguessr } = req.query;
        
        // Build a more sophisticated query based on filters
        let countryQuery: any = {};
        
        // If continent filter is applied, find countries in that continent
        if (continent && continent !== 'all') {
            countryQuery.continent = continent;
        }
        
        // If GeoGuessr filter is applied, find countries in GeoGuessr
        if (in_geoguessr === 'true') {
            countryQuery.in_geoguessr = true;
        }
        
        // Find countries matching all applied filters
        let countryIds: mongoose.Types.ObjectId[] = [];
        
        // Only query the database for countries if we have filters
        if (Object.keys(countryQuery).length > 0) {
            const filteredCountries = await Country.find(countryQuery).select('_id');
            countryIds = filteredCountries.map(country => country._id as mongoose.Types.ObjectId);
            
            // If no countries match the filters, return 0 count
            if (countryIds.length === 0) {
                res.status(200).json({
                    success: true,
                    count: 0
                });
                return;
            }
            
            // Find google cars where at least one of the associated countries matches the filter
            const count = await GoogleCar.countDocuments({
                countries: { $in: countryIds }
            });
            
            res.status(200).json({
                success: true,
                count
            });
        } else {
            // No filters applied, count all google cars
            const count = await GoogleCar.countDocuments({});
            
            res.status(200).json({
                success: true,
                count
            });
        }
    } catch (error) {
        console.error('Error counting google cars:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error counting google cars' 
        });
    }
}; 