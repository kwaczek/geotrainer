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
    const continents = await Country.distinct('continent');
    res.status(200).json({
      success: true,
      continents
    });
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

// Create a new country
export const createCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, capital, continent, code, in_geoguessr } = req.body;

    // Validate required fields
    if (!name || !capital || !continent) {
      res.status(400).json({
        success: false,
        message: 'Name, capital, and continent are required fields'
      });
      return;
    }

    // Check if country already exists with this name
    const existingCountry = await Country.findOne({ name });
    if (existingCountry) {
      res.status(400).json({
        success: false,
        message: 'A country with this name already exists'
      });
      return;
    }

    // Create new country
    const country = await Country.create({
      name,
      capital,
      continent,
      code: code || '',
      in_geoguessr: in_geoguessr || false
    });

    res.status(201).json({
      success: true,
      message: 'Country created successfully',
      country: {
        id: country._id,
        name: country.name,
        capital: country.capital,
        continent: country.continent,
        code: country.code,
        in_geoguessr: country.in_geoguessr
      }
    });
  } catch (error) {
    console.error('Error creating country:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create country'
    });
  }
};

// Update a country
export const updateCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    const countryId = req.params.id;
    const { name, capital, continent, code, in_geoguessr } = req.body;

    // Validate if the id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(countryId)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid country ID format' 
      });
      return;
    }

    // Check if country exists
    const country = await Country.findById(countryId);
    if (!country) {
      res.status(404).json({ 
        success: false,
        message: 'Country not found' 
      });
      return;
    }

    // Check if another country already exists with this name
    if (name && name !== country.name) {
      const existingCountry = await Country.findOne({ name });
      if (existingCountry) {
        res.status(400).json({
          success: false,
          message: 'Another country with this name already exists'
        });
        return;
      }
    }

    // Update country
    const updatedCountry = await Country.findByIdAndUpdate(
      countryId,
      {
        name: name || country.name,
        capital: capital || country.capital,
        continent: continent || country.continent,
        code: code !== undefined ? code : country.code,
        in_geoguessr: in_geoguessr !== undefined ? in_geoguessr : country.in_geoguessr
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Country updated successfully',
      country: {
        id: updatedCountry?._id,
        name: updatedCountry?.name,
        capital: updatedCountry?.capital,
        continent: updatedCountry?.continent,
        code: updatedCountry?.code,
        in_geoguessr: updatedCountry?.in_geoguessr
      }
    });
  } catch (error) {
    console.error('Error updating country:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update country'
    });
  }
};

// Delete a country
export const deleteCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    const countryId = req.params.id;

    // Validate if the id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(countryId)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid country ID format' 
      });
      return;
    }

    // Check if country exists
    const country = await Country.findById(countryId);
    if (!country) {
      res.status(404).json({ 
        success: false,
        message: 'Country not found' 
      });
      return;
    }

    // Check if country is referenced in bollards or license plates
    const Bollard = mongoose.model('Bollard');
    const LicensePlate = mongoose.model('LicensePlate');

    const bollardReferences = await Bollard.countDocuments({ countries: countryId });
    const licensePlateReferences = await LicensePlate.countDocuments({ countries: countryId });

    if (bollardReferences > 0 || licensePlateReferences > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete country because it is referenced in ${bollardReferences} bollards and ${licensePlateReferences} license plates`
      });
      return;
    }

    // Delete country
    await Country.findByIdAndDelete(countryId);

    res.status(200).json({
      success: true,
      message: 'Country deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting country:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete country'
    });
  }
};
