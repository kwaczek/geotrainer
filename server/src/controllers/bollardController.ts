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

// Get count of bollards with optional filters
export const getBollardCount = async (req: Request, res: Response): Promise<void> => {
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
            
            // Find bollards where at least one of the associated countries matches the filter
            const count = await Bollard.countDocuments({
                countries: { $in: countryIds }
            });
            
            res.status(200).json({
                success: true,
                count
            });
        } else {
            // No filters applied, count all bollards
            const count = await Bollard.countDocuments({});
            
            res.status(200).json({
                success: true,
                count
            });
        }
    } catch (error) {
        console.error('Error counting bollards:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error counting bollards' 
        });
    }
};

export const updateBollard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        // Find the bollard first to make sure it exists
        const bollard = await Bollard.findById(id);
        if (!bollard) {
            res.status(404).json({ success: false, message: 'Bollard not found' });
            return;
        }

        const { description, countries, googleMapsUrl } = req.body;
        
        // Update fields
        const updateData: any = {};
        
        if (description) updateData.description = description;
        if (googleMapsUrl) updateData.googleMapsUrl = googleMapsUrl;
        if (countries) updateData.countries = JSON.parse(countries);
        
        // If there's a new image file
        if (req.file) {
            // Delete the old image file
            const oldImagePath = path.join(__dirname, '../../', bollard.imageUrl);
            if (existsSync(oldImagePath)) {
                await fs.unlink(oldImagePath);
            }
            
            // Set the new image URL
            updateData.imageUrl = `/uploads/bollards/${req.file.filename}`;
        }
        
        // Update the bollard
        const updatedBollard = await Bollard.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true }
        ).populate('countries', 'name code');
        
        res.status(200).json({ 
            success: true, 
            bollard: updatedBollard 
        });
    } catch (error) {
        console.error('Error updating bollard:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating bollard' 
        });
    }
};
