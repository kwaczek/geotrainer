import mongoose, { Model } from 'mongoose';
import { QuizFilters } from '../types'; // Assuming QuizFilters is defined in ../types
import Country from '../../../models/Country'; // Import Country model for potential filtering

/**
 * Fetches random incorrect options for a quiz question.
 *
 * @param model The Mongoose model to query (e.g., Country, Bollard).
 * @param correctId The _id of the correct answer, to exclude it.
 * @param count The number of incorrect options to fetch.
 * @param filters Optional filters to apply (e.g., continent, in_geoguessr).
 * @returns A promise resolving to an array of incorrect documents.
 */
export const getRandomOptions = async <T extends mongoose.Document>(
  model: Model<T>,
  correctId: mongoose.Types.ObjectId,
  count: number,
  filters?: QuizFilters
): Promise<T[]> => {
  const matchStage: any = {
    _id: { $ne: correctId } // Exclude the correct answer
  };

  // Apply filters if provided
  if (filters) {
    const countryFilterMatch: any = {};
    if (filters.continent && filters.continent !== 'all') {
      countryFilterMatch.continent = filters.continent;
    }
    if (filters.in_geoguessr) {
      countryFilterMatch.in_geoguessr = true;
    }

    // If filtering is needed and the model is not Country, we might need a lookup
    // For now, let's assume if filters are present, we are dealing with models 
    // that either are Country or have fields linkable to Country (like Bollard, LicensePlate)
    // This might need refinement based on the specific model being queried.
    
    // If the model IS Country, apply filters directly
    if (model.modelName === 'Country') {
        if (filters.continent && filters.continent !== 'all') {
            matchStage.continent = filters.continent;
        }
        if (filters.in_geoguessr) {
            matchStage.in_geoguessr = true;
        }
    } else if (model.modelName === 'Bollard' || model.modelName === 'LicensePlate' || model.modelName === 'RoadSign' || model.modelName === 'Language') {
        // For other models that link to Country via a 'countries' field (array)
        // We need to find items whose associated countries match the filters.
        // This requires finding the matching country IDs first.
        const matchingCountries = await Country.find(countryFilterMatch).select('_id').exec();
        const matchingCountryIds = matchingCountries.map(c => c._id);
        
        // If no countries match the filters, return empty array? Or handle differently?
        if (matchingCountryIds.length === 0 && (filters.continent || filters.in_geoguessr)) {
            console.warn('No countries found matching filters for getRandomOptions');
            return []; 
        }
        
        // Add condition to match documents where 'countries' array contains at least one matching country ID
        // Ensure we only add this filter if country IDs were found
        if(matchingCountryIds.length > 0) {
             matchStage.countries = { $in: matchingCountryIds };
        }
    }
     // Add other filter logic here if needed for different models
  }

  try {
    // Use aggregation pipeline with $match and $sample
    const options = await model.aggregate([
      { $match: matchStage },
      { $sample: { size: count } }
    ]).exec();
    
    console.log(`getRandomOptions: Found ${options.length} options matching criteria:`, matchStage);
    return options as T[];
    
  } catch (error) {
    console.error(`Error fetching random options for model ${model.modelName}:`, error);
    throw new Error(`Could not fetch random options: ${error}`);
  }
}; 