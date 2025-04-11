import mongoose from 'mongoose';
import Pole from '../../../models/Pole';
import Country from '../../../models/Country';
import { QuizFilters, QuizQuestion } from '../types';

/**
 * Generate a random pole question
 */
export async function getRandomPoleQuestion(filters?: QuizFilters, previousEntityIds: string[] = []): Promise<QuizQuestion> {
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
  if (filters?.in_geoguessr) {
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
        'countryDetails.in_geoguessr': true
      }
    });
  }
  
  // Filter out poles that were used in previous questions
  if (previousEntityIds.length > 0) {
    console.log(`Attempting to exclude ${previousEntityIds.length} previous pole entities`);
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
  let poles = await Pole.aggregate(pipeline)
    .lookup({
      from: 'countries',
      localField: 'countries',
      foreignField: '_id',
      as: 'countryDetails'
    });
  
  // If no poles found with the filters + previous exclusion, 
  // try again without excluding previous questions
  if (!poles.length && previousEntityIds.length > 0) {
    console.log('No poles found with exclusion filter, retrying without excluding previous poles');
    
    // Rebuild the pipeline without the exclusion
    const retryPipeline = pipeline.filter(stage => !stage.$match?._id);
    retryPipeline.push({ $sample: { size: 1 } });
    
    poles = await Pole.aggregate(retryPipeline)
      .lookup({
        from: 'countries',
        localField: 'countries',
        foreignField: '_id',
        as: 'countryDetails'
      });
  }
  
  if (!poles.length) {
    throw new Error('No poles found matching the criteria');
  }
  
  const pole = poles[0];
  
  // Get the countries associated with this pole
  const correctCountryIds = pole.countries.map((id: mongoose.Types.ObjectId) => id.toString());
  
  // If there are multiple correct countries, randomly select just one
  let selectedCorrectCountry;
  if (pole.countryDetails.length > 0) {
    // Randomly select one correct country
    const randomIndex = Math.floor(Math.random() * pole.countryDetails.length);
    selectedCorrectCountry = pole.countryDetails[randomIndex];
  } else {
    throw new Error('No country details found for this pole');
  }
  
  // For write mode, we need to track all correct countries, not just one
  const allCorrectCountries = pole.countryDetails.map((country: any) => ({
    id: country._id.toString(),
    text: country.name,
    isCorrect: true
  }));
  
  // Build a filter for additional countries that matches the same criteria
  const additionalCountriesFilter: any = { _id: { $nin: pole.countries } };
  
  // Apply the same continent filter to additional countries
  if (filters?.continent && filters.continent !== 'all') {
    additionalCountriesFilter.continent = filters.continent;
  }
  
  // Apply the same GeoGuessr filter to additional countries
  if (filters?.in_geoguessr) {
    additionalCountriesFilter.in_geoguessr = true;
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
  const allCorrectCountryNames = pole.countryDetails.map((country: any) => country.name);
  
  // Store the actual pole ID in metadata
  const poleId = pole._id.toString();
  console.log(`Using pole with ID: ${poleId}`);
  
  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: 'In which country can you find this utility pole?',
    imageUrl: pole.imageUrl,
    options,
    metadata: {
      allCorrectCountryNames,
      poleId, // Include the actual pole ID in metadata for tracking
      description: pole.description,
      googleMapsUrl: pole.googleMapsUrl
    }
  };
} 