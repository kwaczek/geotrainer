import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import RoadSign from '../models/RoadSign';
import Country from '../models/Country';
import mongoose from 'mongoose';

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/roadsigns/');
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

export const uploadRoadSign = upload.single('image');

export const createRoadSign = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No image file provided' });
            return;
        }

        const { description, countries, googleMapsUrl, isPedestrian } = req.body;

        if (!countries) {
            res.status(400).json({ message: 'Countries are required' });
            return;
        }

        // Ensure uploads directory exists
        const uploadDir = 'uploads/roadsigns';
        if (!existsSync(uploadDir)) {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        // Create a new road sign
        // Parse the JSON string sent from the client
        const countriesArray = JSON.parse(countries);
        
        const roadSign = new RoadSign({
            imageUrl: `/uploads/roadsigns/${req.file.filename}`,
            description: description || '',
            googleMapsUrl: googleMapsUrl || '',
            countries: countriesArray,
            isPedestrian: isPedestrian === 'true'
        });

        await roadSign.save();
        res.status(201).json({ 
            success: true, 
            message: 'Road sign created successfully', 
            data: roadSign 
        });
    } catch (error) {
        console.error('Error creating road sign:', error);
        res.status(500).json({ message: 'Error creating road sign', error: (error as Error).message });
    }
};

export const getAllRoadSigns = async (req: Request, res: Response): Promise<void> => {
    try {
        const roadSigns = await RoadSign.find()
            .populate({
                path: 'countries',
                select: '_id name code flagUrl',
                model: 'Country'
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            roadSigns
        });
    } catch (error) {
        console.error('Error fetching road signs:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching road signs', 
            error: (error as Error).message 
        });
    }
};

export const getRoadSignsByCountry = async (req: Request, res: Response): Promise<void> => {
    try {
        const { countryId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(countryId)) {
            res.status(400).json({ success: false, message: 'Invalid country ID' });
            return;
        }

        const roadSigns = await RoadSign.find({ countries: countryId })
            .populate({
                path: 'countries',
                select: '_id name code flagUrl', // Select only needed fields
                model: 'Country'
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true,
            roadSigns 
        });
    } catch (error) {
        console.error('Error fetching road signs by country:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching road signs by country', 
            error: (error as Error).message 
        });
    }
};

export const getGeoGuessrCountries = async (req: Request, res: Response): Promise<void> => {
    try {
        const countries = await Country.find({ in_geoguessr: true })
            .sort({ name: 1 });
        
        res.status(200).json(countries);
    } catch (error) {
        console.error('Error fetching GeoGuessr countries:', error);
        res.status(500).json({ message: 'Error fetching GeoGuessr countries', error: (error as Error).message });
    }
};

export const deleteRoadSign = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid road sign ID' });
            return;
        }

        const roadSign = await RoadSign.findById(id);
        
        if (!roadSign) {
            res.status(404).json({ message: 'Road sign not found' });
            return;
        }

        // Delete the image file if it exists
        if (roadSign.imageUrl) {
            const imagePath = path.join(process.cwd(), roadSign.imageUrl.replace(/^\//, ''));
            
            if (existsSync(imagePath)) {
                await fs.unlink(imagePath);
            }
        }

        await RoadSign.findByIdAndDelete(id);
        res.status(200).json({ message: 'Road sign deleted successfully' });
    } catch (error) {
        console.error('Error deleting road sign:', error);
        res.status(500).json({ message: 'Error deleting road sign', error: (error as Error).message });
    }
};

export const getRoadSignCount = async (req: Request, res: Response): Promise<void> => {
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
            
            // Find road signs where at least one of the associated countries matches the filter
            const count = await RoadSign.countDocuments({
                countries: { $in: countryIds }
            });
            
            res.status(200).json({
                success: true,
                count
            });
        } else {
            // No filters applied, count all road signs
            const count = await RoadSign.countDocuments({});
            
            res.status(200).json({
                success: true,
                count
            });
        }
    } catch (error) {
        console.error('Error counting road signs:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error getting road sign count', 
            error: (error as Error).message 
        });
    }
}; 