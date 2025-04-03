import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import Language from '../models/Language'; // Changed model import
import Country from '../models/Country';
import mongoose from 'mongoose';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads/languages'); // Changed directory
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

export const uploadLanguage = upload.single('image'); // Renamed function

export const createLanguage = async (req: Request, res: Response): Promise<void> => { // Renamed function
    try {
        console.log('Creating language...'); // Changed log message
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

        console.log('Creating language with data:', { // Changed log message
            imageUrl: `/uploads/languages/${req.file.filename}`, // Changed path
            description,
            countries: JSON.parse(countries)
        });

        const language = new Language({ // Changed model usage
            imageUrl: `/uploads/languages/${req.file.filename}`, // Changed path
            description,
            countries: JSON.parse(countries)
        });

        await language.save(); // Changed model usage
        console.log('Language saved successfully:', language); // Changed log message
        res.status(201).json(language);
    } catch (error) {
        console.error('Error creating language:', error); // Changed log message
        res.status(500).json({ message: 'Error creating language' }); // Changed error message
    }
};

// This function might be reused as is if the Language admin page needs a list of all countries
export const getGeoGuessrCountries = async (req: Request, res: Response): Promise<void> => {
    try {
        const countries = await Country.find().sort('name');
        res.json(countries);
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ message: 'Error fetching countries' });
    }
};

export const getAllLanguages = async (req: Request, res: Response): Promise<void> => { // Renamed function
    try {
        const languages = await Language.find() // Changed model usage
            .populate({
                path: 'countries',
                select: 'name code continent'
            })
            .sort('-createdAt');
        
        // Define an interface for the populated country (can remain the same)
        interface PopulatedCountry {
            _id: mongoose.Types.ObjectId;
            name: string;
            code: string;
            continent: string;
        }
        
        // Define an interface for the transformed language objects
        interface TransformedLanguage { // Renamed interface
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
        const transformedLanguages = languages.map(lang => { // Changed variable name
            // First convert to a plain object
            const langObj = lang.toObject(); // Changed variable name
            
            // Create the base transformed object with default values
            const transformedLanguage: any = { // Changed variable name
                ...langObj,
                country: 'Unknown',
                countryCode: 'unknown',
                continent: 'Unknown'
            };
            
            // Add direct country, countryCode and continent properties if countries exist
            if (langObj.countries && Array.isArray(langObj.countries) && langObj.countries.length > 0) {
                const country = langObj.countries[0] as unknown as PopulatedCountry;
                if (country && typeof country === 'object') {
                    if (country.name) transformedLanguage.country = country.name;
                    if (country.code) transformedLanguage.countryCode = country.code;
                    if (country.continent) transformedLanguage.continent = country.continent;
                }
            }
            
            return transformedLanguage;
        });
        
        res.json(transformedLanguages);
    } catch (error) {
        console.error('Error fetching languages:', error); // Changed log message
        res.status(500).json({ message: 'Error fetching languages' }); // Changed error message
    }
};

export const deleteLanguage = async (req: Request, res: Response): Promise<void> => { // Renamed function
    try {
        const { id } = req.params;
        
        // Find the language first to get the image URL
        const language = await Language.findById(id); // Changed model usage
        if (!language) {
            res.status(404).json({ message: 'Language not found' }); // Changed error message
            return;
        }

        // Extract the filename from the imageUrl
        const imagePath = path.join(process.cwd(), language.imageUrl);
        console.log(`Deleting image at: ${imagePath}`);

        // Delete the language from the database
        await Language.findByIdAndDelete(id); // Changed model usage

        // Delete the image file if it exists
        if (existsSync(imagePath)) {
            await fs.unlink(imagePath);
            console.log(`Deleted image file: ${imagePath}`);
        } else {
            console.log(`Image file not found: ${imagePath}`);
        }

        res.json({ message: 'Language deleted successfully' }); // Changed success message
    } catch (error) {
        console.error('Error deleting language:', error); // Changed log message
        res.status(500).json({ message: 'Error deleting language' }); // Changed error message
    }
};

export const getLanguagesByCountry = async (req: Request, res: Response): Promise<void> => { // Renamed function
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
        
        // Find languages that include this country
        const languages = await Language.find({ // Changed model usage
            countries: { $in: [countryId] } 
        }).sort('-createdAt');
        
        res.status(200).json({
            success: true,
            languages // Changed variable name
        });
    } catch (error) {
        console.error('Error fetching languages by country:', error); // Changed log message
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch languages for this country' // Changed error message
        });
    }
};

// Get count of languages with optional filters
export const getLanguageCount = async (req: Request, res: Response): Promise<void> => { // Renamed function
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
            
            // Find languages where at least one of the associated countries matches the filter
            const count = await Language.countDocuments({ // Changed model usage
                countries: { $in: countryIds }
            });
            
            res.status(200).json({
                success: true,
                count
            });
        } else {
            // No filters applied, count all languages
            const count = await Language.countDocuments({}); // Changed model usage
            
            res.status(200).json({
                success: true,
                count
            });
        }
    } catch (error) {
        console.error('Error counting languages:', error); // Changed log message
        res.status(500).json({
            success: false,
            message: 'Error counting languages' // Changed error message
        });
    }
}; 