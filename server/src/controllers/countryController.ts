import { Request, Response } from 'express';
import Country from '../models/Country';
import mongoose from 'mongoose';

// Get all countries
export const getAllCountries = async (req: Request, res: Response): Promise<void> => {
  try {
    const countries = await Country.find({});
    
    // Map countries to a simpler format
    const formattedCountries = countries.map(country => ({
      id: country._id,
      name: country.name,
      capital: country.capital,
      continent: country.continent,
      code: country.code,
      flagUrl: country.code ? `https://flagcdn.com/w320/${country.code.toLowerCase()}.png` : undefined,
      in_geoguessr: country.in_geoguessr
    }));
    
    res.status(200).json({
      success: true,
      countries: formattedCountries
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries'
    });
  }
};

// Get all continents
export const getContinents = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get distinct continents from the database
    const continents = await Country.distinct('continent');
    
    // Filter out null or empty continents
    const validContinents = continents.filter(continent => continent);
    
    res.status(200).json(validContinents);
  } catch (error) {
    console.error('Error fetching continents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch continents'
    });
  }
};

// Get country details by ID
export const getCountryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const countryId = req.params.id;
    
    // Validate if the id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(countryId)) {
      res.status(400).json({ message: 'Invalid country ID format' });
      return;
    }
    
    const country = await Country.findById(countryId);
    
    if (!country) {
      res.status(404).json({ message: 'Country not found' });
      return;
    }
    
    // Construct flag URL based on country code
    const flagUrl = country.code ? 
      `https://flagcdn.com/w320/${country.code.toLowerCase()}.png` : 
      undefined;
    
    // Return country details
    res.status(200).json({
      success: true,
      country: {
        id: country._id,
        name: country.name,
        capital: country.capital,
        continent: country.continent,
        code: country.code,
        flagUrl,
        in_geoguessr: country.in_geoguessr
      }
    });
  } catch (error) {
    console.error('Error fetching country details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch country details'
    });
  }
};

// Get country details by name
export const getCountryByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const countryName = req.params.name;
    
    // Decode the URL-encoded name
    const decodedName = decodeURIComponent(countryName);
    
    const country = await Country.findOne({ 
      name: decodedName
    });
    
    if (!country) {
      res.status(404).json({ message: 'Country not found' });
      return;
    }
    
    // Construct flag URL based on country code
    const flagUrl = country.code ? 
      `https://flagcdn.com/w320/${country.code.toLowerCase()}.png` : 
      undefined;
    
    // Return country details
    res.status(200).json({
      success: true,
      country: {
        id: country._id,
        name: country.name,
        capital: country.capital,
        continent: country.continent,
        code: country.code,
        flagUrl,
        in_geoguessr: country.in_geoguessr
      }
    });
  } catch (error) {
    console.error('Error fetching country details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch country details'
    });
  }
};

// Get count of countries with optional filters
export const getCountryCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { continent, in_geoguessr } = req.query;
    
    // Build query based on filters
    const query: any = {};
    
    if (continent && continent !== 'all') {
      query.continent = continent;
    }
    
    if (in_geoguessr === 'true') {
      query.in_geoguessr = true;
    }
    
    // Count countries matching the query
    const count = await Country.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error counting countries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to count countries'
    });
  }
};
