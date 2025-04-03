import mongoose, { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Language, { ILanguage as BaseILanguage } from '../../../models/Language';
import Country, { ICountry as BaseICountry } from '../../../models/Country';
import { QuizQuestion, QuizOption, QuizFilters } from '../types';
import { getRandomOptions } from './utils';

// Explicitly define _id for Language and Country within this context
interface ILanguage extends BaseILanguage {
  _id: Types.ObjectId;
}
interface ICountry extends BaseICountry {
  _id: Types.ObjectId;
}

// Define a type for the aggregation result, ensuring _id is present
interface AggregatedLanguage extends ILanguage {
  _id: Types.ObjectId; // Re-assert _id type here
  countryDetails: ICountry[];
}

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
    
    // Apply match after lookup
    const countryMatchStage: any = {};
    if (filters.continent && filters.continent !== 'all') {
      countryMatchStage['countryDetails.continent'] = filters.continent;
    }
    if (filters.in_geoguessr) {
      countryMatchStage['countryDetails.in_geoguessr'] = true;
    }
     // Ensure we have country details to filter on
    countryMatchStage['countryDetails.0'] = { $exists: true }; 

    // Add the country filter stage after the lookup
    lookupPipeline.push({ $match: countryMatchStage });
  }
  
  return { lookupPipeline, matchStage }; // Return both pipeline steps and initial match
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
    // Initial match for language ID exclusion
    { $match: matchStage }, 
    // Optional lookup and country filtering pipeline steps
    ...lookupPipeline,
     // If not filtering by country, we still need the lookup
    ...(lookupPipeline.length === 0 ? [{
      $lookup: {
        from: 'countries',
        localField: 'countries',
        foreignField: '_id',
        as: 'countryDetails'
      }
    }] : []),
    // Ensure we only get languages associated with at least one country after any potential filtering
    { $match: { 'countryDetails.0': { $exists: true } } },
    // Get a random language
    { $sample: { size: 1 } },
  ];

  // Cast the result of aggregate to our specific type
  const results = await Language.aggregate<AggregatedLanguage>(aggregationPipeline).exec();

  if (!results || results.length === 0 || !(results[0]?._id instanceof Types.ObjectId)) {
    throw new Error('No matching language found or result missing valid _id.');
  }

  const randomLanguage = results[0] as AggregatedLanguage; 
  
  if (!randomLanguage.countryDetails || randomLanguage.countryDetails.length === 0) {
    throw new Error(`Language ${randomLanguage._id.toString()} has no associated country details.`);
  }

  const correctCountry = randomLanguage.countryDetails[0] as ICountry;

  // Ensure correctCountry._id is valid ObjectId before passing to getRandomOptions
  if (!(correctCountry._id instanceof Types.ObjectId)) {
    throw new Error(`Language ${randomLanguage._id.toString()} has invalid associated country ObjectId.`);
  }

  // Ensure getRandomOptions returns items with valid _id
  const incorrectOptions = await getRandomOptions(Country, correctCountry._id, 3, filters);

  const options: QuizOption[] = [
    // Assert _id type here for certainty
    { id: (correctCountry._id as Types.ObjectId).toString(), text: correctCountry.name, isCorrect: true },
    ...(incorrectOptions as ICountry[]).map((opt) => {
      // Check and assert _id type within the map
      const optionId = (opt?._id instanceof Types.ObjectId) ? opt._id.toString() : uuidv4();
      return {
        id: optionId,
        text: opt?.name ?? 'Unknown Country', 
        isCorrect: false
      };
    })
  ].sort(() => Math.random() - 0.5); 

  const question: QuizQuestion = {
    // Assert _id type here for certainty
    id: (randomLanguage._id as Types.ObjectId).toString(), 
    question: `Which country is primarily associated with this language/script?`, 
    imageUrl: randomLanguage.imageUrl,
    options: options,
    metadata: {
      // Assert _id type here for certainty
      correctCountryId: (correctCountry._id as Types.ObjectId).toString(), 
      correctCountryName: correctCountry.name,
      languageName: randomLanguage.description,
      allCorrectCountryNames: randomLanguage.countryDetails.map(country => country.name)
    }
  };

  console.log('Generated language question:', question.id, 'Correct answer:', correctCountry.name);
  return question;
}; 