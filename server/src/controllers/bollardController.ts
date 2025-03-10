import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import Bollard from '../models/Bollard';
import Country from '../models/Country';
import mongoose from 'mongoose';

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/bollards/');
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

export const uploadBollard = upload.single('image');

export const createBollard = async (req: Request, res: Response): Promise<void> => {
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

        const bollard = new Bollard({
            imageUrl: `/uploads/bollards/${req.file.filename}`,
            description,
            googleMapsUrl,
            countries: JSON.parse(countries)
        });

        await bollard.save();
        res.status(201).json(bollard);
    } catch (error) {
        console.error('Error creating bollard:', error);
        res.status(500).json({ message: 'Error creating bollard' });
    }
};

export const getGeoGuessrCountries = async (req: Request, res: Response): Promise<void> => {
    try {
        const countries = await Country.find({ in_geoguessr: true })
            .select('name code')
            .sort('name');
        res.json(countries);
    } catch (error) {
        console.error('Error fetching GeoGuessr countries:', error);
        res.status(500).json({ message: 'Error fetching countries' });
    }
};

export const getAllBollards = async (req: Request, res: Response): Promise<void> => {
    try {
        const bollards = await Bollard.find()
            .populate('countries', 'name code')
            .sort('-createdAt');
        res.json(bollards);
    } catch (error) {
        console.error('Error fetching bollards:', error);
        res.status(500).json({ message: 'Error fetching bollards' });
    }
};

export const deleteBollard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        // Find the bollard first to get the image URL
        const bollard = await Bollard.findById(id);
        if (!bollard) {
            res.status(404).json({ message: 'Bollard not found' });
            return;
        }

        // Extract the filename from the imageUrl
        const imagePath = path.join(__dirname, '../../', bollard.imageUrl);

        // Delete the bollard from the database
        await Bollard.findByIdAndDelete(id);

        // Delete the image file if it exists
        if (existsSync(imagePath)) {
            await fs.unlink(imagePath);
        }

        res.json({ message: 'Bollard deleted successfully' });
    } catch (error) {
        console.error('Error deleting bollard:', error);
        res.status(500).json({ message: 'Error deleting bollard' });
    }
};

export const getBollardsByCountry = async (req: Request, res: Response): Promise<void> => {
    try {
        const { countryId } = req.params;
        
        // Validate if the id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(countryId)) {
            res.status(400).json({ 
                success: false,
                message: 'Invalid country ID format' 
            });
            return;
        }
        
        // Find bollards that include this country
        const bollards = await Bollard.find({ 
            countries: { $in: [countryId] } 
        }).sort('-createdAt');
        
        res.status(200).json({
            success: true,
            bollards
        });
    } catch (error) {
        console.error('Error fetching bollards by country:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch bollards for this country' 
        });
    }
};
