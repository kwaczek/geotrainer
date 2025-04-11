import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import Pole from '../models/Pole'; // Import Pole model
import Country from '../models/Country';
import mongoose from 'mongoose';

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the directory exists
        const dir = 'uploads/poles/';
        fs.mkdir(dir, { recursive: true }).then(() => {
            cb(null, dir);
        }).catch(err => cb(err, dir));
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

export const uploadPole = upload.single('image'); // Changed function name

export const createPole = async (req: Request, res: Response): Promise<void> => { // Changed function name
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

        // Validate country IDs
        let parsedCountries: string[];
        try {
            parsedCountries = JSON.parse(countries);
            if (!Array.isArray(parsedCountries) || !parsedCountries.every(id => mongoose.Types.ObjectId.isValid(id))) {
                throw new Error('Invalid country ID format');
            }
        } catch (error) {
            res.status(400).json({ message: 'Invalid format for countries array' });
            return;
        }

        const pole = new Pole({ // Use Pole model
            imageUrl: `/uploads/poles/${req.file.filename}`, // Adjusted path
            description,
            googleMapsUrl,
            countries: parsedCountries
        });

        await pole.save();
        // Populate countries before sending response
        const populatedPole = await Pole.findById(pole._id).populate('countries', 'name code');
        res.status(201).json(populatedPole);
    } catch (error) {
        console.error('Error creating pole:', error);
        // Cleanup uploaded file if db save fails
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file after db error:', unlinkError);
            }
        }
        res.status(500).json({ message: 'Error creating pole' });
    }
};

// Note: getGeoGuessrCountries is likely a shared function, kept in bollardController for now
// If needed elsewhere, consider moving to a countryController

export const getAllPoles = async (req: Request, res: Response): Promise<void> => { // Changed function name
    try {
        const poles = await Pole.find() // Use Pole model
            .populate('countries', 'name code')
            .sort('-createdAt');
        res.json(poles);
    } catch (error) {
        console.error('Error fetching poles:', error);
        res.status(500).json({ message: 'Error fetching poles' });
    }
};

export const deletePole = async (req: Request, res: Response): Promise<void> => { // Changed function name
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid Pole ID format' });
            return;
        }
        
        const pole = await Pole.findById(id); // Use Pole model
        if (!pole) {
            res.status(404).json({ message: 'Pole not found' });
            return;
        }

        const imagePath = path.join(__dirname, '../../', pole.imageUrl); // Adjusted path base

        await Pole.findByIdAndDelete(id); // Use Pole model

        if (existsSync(imagePath)) {
            try {
                await fs.unlink(imagePath);
            } catch (unlinkError) {
                console.error(`Error deleting pole image file ${imagePath}:`, unlinkError);
                // Decide if this error should be reported to the client
            }
        }

        res.json({ message: 'Pole deleted successfully' });
    } catch (error) {
        console.error('Error deleting pole:', error);
        // Check for specific mongoose errors (e.g., CastError) if needed
        res.status(500).json({ message: 'Error deleting pole' });
    }
};

// Optional: Add functions like getPolesByCountry or getPoleCount if needed, similar to bollards
// Example: Get poles by country
export const getPolesByCountry = async (req: Request, res: Response): Promise<void> => {
    try {
        const { countryId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(countryId)) {
            res.status(400).json({ message: 'Invalid country ID format' });
            return;
        }
        
        const poles = await Pole.find({ countries: countryId }) // Use Pole model
            .populate('countries', 'name code')
            .sort('-createdAt');
            
        res.json(poles);
    } catch (error) {
        console.error('Error fetching poles by country:', error);
        res.status(500).json({ message: 'Error fetching poles for this country' });
    }
};

// Example: Get pole count with optional filters
export const getPoleCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { continent, in_geoguessr } = req.query;
        let countryQuery: any = {};
        
        if (continent && typeof continent === 'string' && continent !== 'all') {
            countryQuery.continent = continent;
        }
        
        if (in_geoguessr === 'true') {
            countryQuery.in_geoguessr = true;
        }
        
        let countQuery: any = {};
        if (Object.keys(countryQuery).length > 0) {
            const filteredCountries = await Country.find(countryQuery).select('_id');
            const countryIds = filteredCountries.map(c => c._id);
            
            if (countryIds.length === 0) {
                res.json({ count: 0 });
                return;
            }
            countQuery.countries = { $in: countryIds };
        }
        
        const count = await Pole.countDocuments(countQuery); // Use Pole model
        res.json({ count });
    } catch (error) {
        console.error('Error counting poles:', error);
        res.status(500).json({ message: 'Error counting poles' });
    }
}; 