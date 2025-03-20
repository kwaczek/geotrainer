import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import LicensePlate from '../models/LicensePlate';
import Country from '../models/Country';
import mongoose from 'mongoose';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads/licenseplates');
if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
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

export const uploadLicensePlate = upload.single('image');

export const createLicensePlate = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Creating license plate...');
        console.log('Request file:', req.file);
        console.log('Request body:', req.body);

        if (!req.file) {
            console.log('No image file provided');
            res.status(400).json({ message: 'No image file provided' });
            return;
        }

        const { description, countries } = req.body;

        if (!description || !countries) {
            console.log('Missing required fields:', { description, countries });
            res.status(400).json({ message: 'Description and countries are required' });
            return;
        }

        console.log('Creating license plate with data:', {
            imageUrl: `/uploads/licenseplates/${req.file.filename}`,
            description,
            countries: JSON.parse(countries)
        });

        const licensePlate = new LicensePlate({
            imageUrl: `/uploads/licenseplates/${req.file.filename}`,
            description,
            countries: JSON.parse(countries)
        });

        await licensePlate.save();
        console.log('License plate saved successfully:', licensePlate);
        res.status(201).json(licensePlate);
    } catch (error) {
        console.error('Error creating license plate:', error);
        res.status(500).json({ message: 'Error creating license plate' });
    }
};

export const getGeoGuessrCountries = async (req: Request, res: Response): Promise<void> => {
    try {
        const countries = await Country.find().sort('name');
        res.json(countries);
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ message: 'Error fetching countries' });
    }
};

export const getAllLicensePlates = async (req: Request, res: Response): Promise<void> => {
    try {
        const licensePlates = await LicensePlate.find()
            .populate({
                path: 'countries',
                select: 'name code continent'
            })
            .sort('-createdAt');
        
        // Define an interface for the populated country
        interface PopulatedCountry {
            _id: mongoose.Types.ObjectId;
            name: string;
            code: string;
            continent: string;
        }
        
        // Define an interface for the transformed plate objects
        interface TransformedPlate {
            _id: mongoose.Types.ObjectId;
            imageUrl: string;
            description: string;
            countries: PopulatedCountry[];
            country: string;
            countryCode: string;
            continent: string;
            createdAt: Date;
            updatedAt: Date;
            __v: number;
        }
        
        // Transform data to include direct country and continent properties
        const transformedPlates = licensePlates.map(plate => {
            // First convert to a plain object
            const plateObj = plate.toObject();
            
            // Create the base transformed object with default values
            const transformedPlate: any = {
                ...plateObj,
                country: 'Unknown',
                countryCode: 'unknown',
                continent: 'Unknown'
            };
            
            // Add direct country, countryCode and continent properties if countries exist
            if (plateObj.countries && Array.isArray(plateObj.countries) && plateObj.countries.length > 0) {
                const country = plateObj.countries[0] as unknown as PopulatedCountry;
                if (country && typeof country === 'object') {
                    if (country.name) transformedPlate.country = country.name;
                    if (country.code) transformedPlate.countryCode = country.code;
                    if (country.continent) transformedPlate.continent = country.continent;
                }
            }
            
            return transformedPlate;
        });
        
        res.json(transformedPlates);
    } catch (error) {
        console.error('Error fetching license plates:', error);
        res.status(500).json({ message: 'Error fetching license plates' });
    }
};

export const deleteLicensePlate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        // Find the license plate first to get the image URL
        const licensePlate = await LicensePlate.findById(id);
        if (!licensePlate) {
            res.status(404).json({ message: 'License plate not found' });
            return;
        }

        // Extract the filename from the imageUrl
        const imagePath = path.join(process.cwd(), licensePlate.imageUrl);
        console.log(`Deleting image at: ${imagePath}`);

        // Delete the license plate from the database
        await LicensePlate.findByIdAndDelete(id);

        // Delete the image file if it exists
        if (existsSync(imagePath)) {
            await fs.unlink(imagePath);
            console.log(`Deleted image file: ${imagePath}`);
        } else {
            console.log(`Image file not found: ${imagePath}`);
        }

        res.json({ message: 'License plate deleted successfully' });
    } catch (error) {
        console.error('Error deleting license plate:', error);
        res.status(500).json({ message: 'Error deleting license plate' });
    }
};

export const getLicensePlatesByCountry = async (req: Request, res: Response): Promise<void> => {
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
        
        // Find license plates that include this country
        const licensePlates = await LicensePlate.find({ 
            countries: { $in: [countryId] } 
        }).sort('-createdAt');
        
        res.status(200).json({
            success: true,
            licensePlates
        });
    } catch (error) {
        console.error('Error fetching license plates by country:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch license plates for this country' 
        });
    }
};

// Get count of license plates with optional filters
export const getLicensePlateCount = async (req: Request, res: Response): Promise<void> => {
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
            
            // Find license plates where at least one of the associated countries matches the filter
            const count = await LicensePlate.countDocuments({
                countries: { $in: countryIds }
            });
            
            res.status(200).json({
                success: true,
                count
            });
        } else {
            // No filters applied, count all license plates
            const count = await LicensePlate.countDocuments({});
            
            res.status(200).json({
                success: true,
                count
            });
        }
    } catch (error) {
        console.error('Error counting license plates:', error);
        res.status(500).json({
            success: false,
            message: 'Error counting license plates'
        });
    }
}; 