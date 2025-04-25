import { Request, Response } from 'express';
import Country from '../models/Country';
import mongoose from 'mongoose';

// Get all countries
export const getAllCountries = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all fields for all countries
    const countries = await Country.find({});

    // Send the full country documents
    res.status(200).json({
      success: true,
      countries: countries // Send the raw documents directly
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

    // Return country details with all available fields
    res.status(200).json({
      success: true,
      country: {
        id: country._id,
        name: country.name,
        capital: country.capital,
        continent: country.continent,
        code: country.code,
        flagUrl,
        in_geoguessr: country.in_geoguessr,
        population: country.population,
        area: country.area,
        domain: country.domain,
        currency: country.currency,
        phone_prefix: country.phone_prefix,
        driving_side: country.driving_side,
        camera_generation: country.camera_generation
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

    // Return country details with all available fields
    res.status(200).json({
      success: true,
      country: {
        id: country._id,
        name: country.name,
        capital: country.capital,
        continent: country.continent,
        code: country.code,
        flagUrl,
        in_geoguessr: country.in_geoguessr,
        population: country.population,
        area: country.area,
        domain: country.domain,
        currency: country.currency,
        phone_prefix: country.phone_prefix,
        driving_side: country.driving_side,
        camera_generation: country.camera_generation
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
    const { continent, in_geoguessr, has_domain, has_currency } = req.query;

    console.log('Country count request with params:', { continent, in_geoguessr, has_domain, has_currency });

    // Build query based on filters
    const query: any = {};

    if (continent && continent !== 'all') {
      query.continent = continent;
    }

    if (in_geoguessr === 'true') {
      query.in_geoguessr = true;
    }

    // Add filter for domains quiz to only count countries with domains
    if (has_domain === 'true') {
      query.domain = { $exists: true, $ne: null, $not: { $size: 0 } };
    }

    // Add filter for currencies quiz to only count countries with currencies
    if (has_currency === 'true') {
      query.currency = { $exists: true, $ne: null, $not: { $size: 0 } };
    }

    console.log('MongoDB query:', JSON.stringify(query));

    // Count countries matching the query
    const count = await Country.countDocuments(query);

    console.log('Countries count result:', count);

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
    // Destructure ALL relevant fields from the body
    const {
      name, capital, continent, code, in_geoguessr,
      domain, currency, population, area, phone_prefix, driving_side, camera_generation
    } = req.body;

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

    // Create new country, passing all destructured fields
    const countryData: any = {
      name,
      capital,
      continent,
      code: code || undefined, // Use undefined if empty/null
      in_geoguessr: in_geoguessr || false
    };
    // Add optional fields only if they have a value
    if (domain && domain.length > 0) countryData.domain = domain;
    if (currency && currency.length > 0) countryData.currency = currency;
    if (population !== undefined && population !== null && population !== '') countryData.population = Number(population);
    if (area !== undefined && area !== null && area !== '') countryData.area = Number(area);
    if (phone_prefix) countryData.phone_prefix = phone_prefix;
    if (driving_side) countryData.driving_side = driving_side;
    // Ensure camera_generation is an object before saving
    if (camera_generation && typeof camera_generation === 'object' && Object.keys(camera_generation).length > 0) {
        countryData.camera_generation = camera_generation;
    }

    const country = await Country.create(countryData);

    // Return the full new country object in the response
    res.status(201).json({
      success: true,
      message: 'Country created successfully',
      country // Send the complete created document
    });
  } catch (error: any) { // Catch specifically for validation error check
    // Handle potential validation errors from Mongoose during creation
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.errors
        });
        return; // Stop execution after sending validation error response
    }
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
    // Destructure all potential fields from the body
    const {
      name, capital, continent, code, in_geoguessr,
      domain, currency, population, area, phone_prefix, driving_side, camera_generation
    } = req.body;

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

    // Build the update object dynamically
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (capital !== undefined) updateData.capital = capital;
    if (continent !== undefined) updateData.continent = continent;
    if (code !== undefined) updateData.code = code; // Allow setting code to empty string or value
    if (in_geoguessr !== undefined) updateData.in_geoguessr = in_geoguessr;
    if (domain !== undefined) updateData.domain = domain; // Expecting array from frontend
    if (currency !== undefined) updateData.currency = currency; // Expecting array of objects
    if (population !== undefined) updateData.population = population;
    if (area !== undefined) updateData.area = area;
    if (phone_prefix !== undefined) updateData.phone_prefix = phone_prefix;
    if (driving_side !== undefined) updateData.driving_side = driving_side;
    if (camera_generation !== undefined) updateData.camera_generation = camera_generation; // Expecting object from frontend

    // Update country using the built object
    const updatedCountry = await Country.findByIdAndUpdate(
      countryId,
      updateData, // Use the dynamically built update object
      { new: true, runValidators: true } // Return the updated doc and run schema validators
    );

    if (!updatedCountry) {
      // This case should ideally be covered by the findById check earlier,
      // but added for robustness in case of race conditions or other issues.
      res.status(404).json({
        success: false,
        message: 'Country not found after update attempt'
      });
      return;
    }

    // Return the full updated country object
    res.status(200).json({
      success: true,
      message: 'Country updated successfully',
      country: updatedCountry // Send the complete updated document
    });
  } catch (error: any) {
    // Handle potential validation errors from Mongoose
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.errors
        });
    }
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
