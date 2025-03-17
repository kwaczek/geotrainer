import mongoose from 'mongoose';
import Bollard from '../../../models/Bollard';
import Country from '../../../models/Country';
import { QuizFilters, QuizQuestion } from '../types';

/**
 * Generate a random bollard question
 */
export async function getRandomBollardQuestion(filters?: QuizFilters, previousEntityIds: string[] = []): Promise<QuizQuestion> {
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
  
  // Filter out bollards that were used in previous questions
  if (previousEntityIds.length > 0) {
    console.log(`Attempting to exclude ${previousEntityIds.length} previous bollard entities`);
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
  let bollards = await Bollard.aggregate(pipeline)
    .lookup({
      from: 'countries',
      localField: 'countries',
      foreignField: '_id',
      as: 'countryDetails'
    });
  
  // If no bollards found with the filters + previous exclusion, 
  // try again without excluding previous questions
  if (!bollards.length && previousEntityIds.length > 0) {
    console.log('No bollards found with exclusion filter, retrying without excluding previous bollards');
    
    // Rebuild the pipeline without the exclusion
    const retryPipeline = pipeline.filter(stage => !stage.$match?._id);
    retryPipeline.push({ $sample: { size: 1 } });
    
    bollards = await Bollard.aggregate(retryPipeline)
      .lookup({
        from: 'countries',
        localField: 'countries',
        foreignField: '_id',
        as: 'countryDetails'
      });
  }
  
  if (!bollards.length) {
    throw new Error('No bollards found matching the criteria');
  }
  
  const bollard = bollards[0];
  
  // Get the countries associated with this bollard
  const correctCountryIds = bollard.countries.map((id: mongoose.Types.ObjectId) => id.toString());
  
  // If there are multiple correct countries, randomly select just one
  let selectedCorrectCountry;
  if (bollard.countryDetails.length > 0) {
    // Randomly select one correct country
    const randomIndex = Math.floor(Math.random() * bollard.countryDetails.length);
    selectedCorrectCountry = bollard.countryDetails[randomIndex];
  } else {
    throw new Error('No country details found for this bollard');
  }
  
  // For write mode, we need to track all correct countries, not just one
  const allCorrectCountries = bollard.countryDetails.map((country: any) => ({
    id: country._id.toString(),
    text: country.name,
    isCorrect: true
  }));
  
  // Build a filter for additional countries that matches the same criteria
  const additionalCountriesFilter: any = { _id: { $nin: bollard.countries } };
  
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
  const allCorrectCountryNames = bollard.countryDetails.map((country: any) => country.name);
  
  // Store the actual bollard ID in metadata
  const bollardId = bollard._id.toString();
  console.log(`Using bollard with ID: ${bollardId}`);
  
  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: 'In which country can you find this bollard?',
    imageUrl: bollard.imageUrl,
    options,
    metadata: {
      allCorrectCountryNames,
      bollardId // Include the actual bollard ID in metadata for tracking
    }
  };
} 