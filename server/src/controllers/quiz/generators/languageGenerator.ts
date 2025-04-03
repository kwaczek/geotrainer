import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Language, { ILanguage } from '../../../models/Language';
import Country, { ICountry } from '../../../models/Country';
import { QuizQuestion, QuizOption, QuizFilters } from '../types';
import { getRandomOptions } from './utils'; // Assuming utils has a function to get random options

// Helper function to build the aggregation pipeline match stage based on filters
const buildLanguageMatchStage = (filters?: QuizFilters, excludedIds: string[] = []) => {
  const matchStage: any = {};
  
  // Exclude already used languages
  if (excludedIds.length > 0) {
    matchStage._id = { $nin: excludedIds.map(id => new mongoose.Types.ObjectId(id)) };
  }
  
  // If country filters are needed (continent, geoguessr), we'll need a $lookup first
  const lookupPipeline: any[] = [];
  if (filters?.continent || filters?.in_geoguessr) {
    lookupPipeline.push({
      $lookup: {
        from: 'countries', // The name of the Country collection
        localField: 'countries',
        foreignField: '_id',
        as: 'countryDetails'
      }
    });
    
    if (filters.continent && filters.continent !== 'all') {
      matchStage['countryDetails.continent'] = filters.continent;
    }
    if (filters.in_geoguessr) {
      matchStage['countryDetails.in_geoguessr'] = true;
    }
  }
  
  return { lookupPipeline, matchStage };
};

/**
 * Generate a random language question
 */
export const getRandomLanguageQuestion = async (
  filters?: QuizFilters,
  previousEntityIds: string[] = []
): Promise<QuizQuestion> => {
  console.log('Generating language question with filters:', filters, 'excluding:', previousEntityIds);

  const { lookupPipeline, matchStage } = buildLanguageMatchStage(filters, previousEntityIds);

  const aggregationPipeline: any[] = [
    // Optional lookup if filtering by country properties
    ...lookupPipeline,
    // Apply filters
    { $match: matchStage },
    // Get a random language
    { $sample: { size: 1 } },
    // Re-lookup country details if not already done (or to ensure we have the latest)
    {
      $lookup: {
        from: 'countries',
        localField: 'countries',
        foreignField: '_id',
        as: 'countryDetails'
      }
    },
    // Ensure we only get languages associated with at least one country
    { $match: { 'countryDetails.0': { $exists: true } } }
  ];

  const results = await Language.aggregate(aggregationPipeline).exec();

  if (!results || results.length === 0) {
    throw new Error('No matching language found for the given filters.');
  }

  const randomLanguage = results[0] as ILanguage & { countryDetails: ICountry[] };
  const correctCountry = randomLanguage.countryDetails[0]; // Use the first associated country

  if (!correctCountry) {
    throw new Error(`Language ${randomLanguage._id} has no associated country details.`);
  }

  // Get 3 incorrect options (Country names)
  const incorrectOptions = await getRandomOptions(Country, correctCountry._id, 3, filters);

  // Create the options array
  const options: QuizOption[] = [
    { id: correctCountry._id.toString(), text: correctCountry.name, isCorrect: true },
    ...incorrectOptions.map((opt: ICountry) => ({ id: opt._id.toString(), text: opt.name, isCorrect: false }))
  ].sort(() => Math.random() - 0.5); // Shuffle options

  // Format the question
  const question: QuizQuestion = {
    id: randomLanguage._id.toString(), // Use language ID as the question ID for tracking
    question: `Which country is primarily associated with the ${randomLanguage.description} language/script?`, // Use language description
    imageUrl: randomLanguage.imageUrl, // Use language image URL
    options: options,
    metadata: {
      correctCountryId: correctCountry._id.toString(),
      correctCountryName: correctCountry.name,
      languageName: randomLanguage.description // Add language name to metadata
    }
  };

  console.log('Generated language question:', question.id, 'Correct answer:', correctCountry.name);
  return question;
}; 