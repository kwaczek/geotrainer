import mongoose from 'mongoose';
import GoogleCar from '../../../models/GoogleCar'; // Changed model
import Country from '../../../models/Country';
import { QuizFilters, QuizQuestion } from '../types';

/**
 * Generate a random Google Car question
 */
export async function getRandomGoogleCarQuestion(filters?: QuizFilters, previousEntityIds: string[] = []): Promise<QuizQuestion> {
  // Build the aggregation pipeline based on filters
  const pipeline: any[] = [];
  
  // Add continent filter if specified
  if (filters?.continent && filters.continent !== 'all') {
    pipeline.push({
      $lookup: {
        from: 'countries',
        localField: 'countries',
        foreignField: '_id',
        as: 'countryDetails'
      }
    });
    pipeline.push({
      $match: {
        'countryDetails.continent': filters.continent
      }
    });
  }
  
  // Add GeoGuessr filter if specified
  if (filters?.in_geoguessr) { // Corrected filter name to match frontend
    if (!pipeline.some(stage => stage.$lookup?.as === 'countryDetails')) {
      pipeline.push({
        $lookup: {
          from: 'countries',
          localField: 'countries',
          foreignField: '_id',
          as: 'countryDetails'
        }
      });
    }
    pipeline.push({
      $match: {
        'countryDetails.in_geoguessr': true // Corrected field name
      }
    });
  }
  
  // Filter out cars that were used in previous questions
  if (previousEntityIds.length > 0) {
    console.log(`Attempting to exclude ${previousEntityIds.length} previous car entities`);
    // Convert string IDs to ObjectId for MongoDB comparison
    const objectIds = previousEntityIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return id; // If conversion fails, keep the string
      }
    });
    
    pipeline.push({
      $match: {
        _id: { $nin: objectIds }
      }
    });
  }
  
  // Add random sampling
  pipeline.push({ $sample: { size: 1 } });
  
  // Execute the query
  let googleCars = await GoogleCar.aggregate(pipeline) // Changed model
    .lookup({
      from: 'countries',
      localField: 'countries',
      foreignField: '_id',
      as: 'countryDetails'
    });
  
  // If no cars found with the filters + previous exclusion, 
  // try again without excluding previous questions
  if (!googleCars.length && previousEntityIds.length > 0) {
    console.log('No cars found with exclusion filter, retrying without excluding previous cars');
    
    // Rebuild the pipeline without the exclusion
    const retryPipeline = pipeline.filter(stage => !stage.$match?._id);
    retryPipeline.push({ $sample: { size: 1 } });
    
    googleCars = await GoogleCar.aggregate(retryPipeline) // Changed model
      .lookup({
        from: 'countries',
        localField: 'countries',
        foreignField: '_id',
        as: 'countryDetails'
      });
  }
  
  if (!googleCars.length) {
    throw new Error('No Google Cars found matching the criteria'); // Updated error message
  }
  
  const googleCar = googleCars[0]; // Changed variable name
  
  // Get the countries associated with this car
  const correctCountryIds = googleCar.countries.map((id: mongoose.Types.ObjectId) => id.toString());
  
  // If there are multiple correct countries, randomly select just one
  let selectedCorrectCountry;
  if (googleCar.countryDetails.length > 0) {
    // Randomly select one correct country
    const randomIndex = Math.floor(Math.random() * googleCar.countryDetails.length);
    selectedCorrectCountry = googleCar.countryDetails[randomIndex];
  } else {
    throw new Error('No country details found for this Google Car'); // Updated error message
  }
  
  // For write mode, we need to track all correct countries, not just one
  const allCorrectCountries = googleCar.countryDetails.map((country: any) => ({
    id: country._id.toString(),
    text: country.name,
    isCorrect: true
  }));
  
  // Build a filter for additional countries that matches the same criteria
  const additionalCountriesFilter: any = { _id: { $nin: googleCar.countries } };
  
  // Apply the same continent filter to additional countries
  if (filters?.continent && filters.continent !== 'all') {
    additionalCountriesFilter.continent = filters.continent;
  }
  
  // Apply the same GeoGuessr filter to additional countries
  if (filters?.in_geoguessr) { // Corrected filter name
    additionalCountriesFilter.in_geoguessr = true; // Corrected field name
  }
  
  // Get additional random countries for options (we need 3 more to have 4 total)
  const additionalCountries = await Country.aggregate([
    { $match: additionalCountriesFilter },
    { $sample: { size: 3 } }
  ]);
  
  // Create an array with exactly 4 options: 1 correct + 3 incorrect
  const allCountries = [
    selectedCorrectCountry,
    ...additionalCountries
  ];
  
  // Shuffle the countries
  for (let i = allCountries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCountries[i], allCountries[j]] = [allCountries[j], allCountries[i]];
  }
  
  // Create options, using the correct countries for the options display
  const options = allCountries.map(country => ({
    id: country._id.toString(),
    text: country.name,
    isCorrect: country._id.toString() === selectedCorrectCountry._id.toString()
  }));
  
  // Add metadata for write mode - store all correct country names
  // This will be used by the client to validate write mode answers
  const allCorrectCountryNames = googleCar.countryDetails.map((country: any) => country.name);
  
  // Store the actual car ID in metadata
  const googleCarId = googleCar._id.toString(); // Changed variable name
  console.log(`Using Google Car with ID: ${googleCarId}`); // Updated log message
  
  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: 'In which country can you find this Google Car?', // Updated question text
    imageUrl: googleCar.imageUrl,
    options,
    metadata: {
      allCorrectCountryNames,
      entityId: googleCarId, // Changed metadata key to generic 'entityId'
      description: googleCar.description,
      googleMapsUrl: googleCar.googleMapsUrl
    }
  };
} 