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

  // Add check for results[0] and its _id before proceeding
  if (!results || results.length === 0 || !results[0]._id) {
    throw new Error('No matching language found or result missing _id.');
  }

  const randomLanguage = results[0] as AggregatedLanguage; 
  
  if (!randomLanguage.countryDetails || randomLanguage.countryDetails.length === 0) {
    throw new Error(`Language ${randomLanguage._id?.toString()} has no associated country details after filtering.`);
  }

  const correctCountry = randomLanguage.countryDetails[0] as ICountry;

  // Strengthen the check using instanceof ObjectId
  if (!correctCountry || !(correctCountry._id instanceof Types.ObjectId)) {
    throw new Error(`Language ${randomLanguage._id?.toString()} has invalid or missing associated country ObjectId.`);
  }

  const incorrectOptions = await getRandomOptions(Country, correctCountry._id, 3, filters);

  const options: QuizOption[] = [
    { id: correctCountry._id.toString(), text: correctCountry.name, isCorrect: true },
    ...(incorrectOptions as ICountry[]).map((opt) => {
      // Strengthen check inside map using instanceof ObjectId
      const optionId = (opt && opt._id instanceof Types.ObjectId) ? opt._id.toString() : uuidv4();
      const optionText = opt?.name ?? 'Unknown Country';
      return {
        id: optionId,
        text: optionText, 
        isCorrect: false
      };
    })
  ].sort(() => Math.random() - 0.5); 

  // randomLanguage._id is now strongly checked via results[0]._id check
  const question: QuizQuestion = {
    id: randomLanguage._id.toString(), 
    question: `Which country is primarily associated with this language/script?`, 
    imageUrl: randomLanguage.imageUrl,
    options: options,
    metadata: {
      correctCountryId: correctCountry._id.toString(), // Checked above
      correctCountryName: correctCountry.name,
      languageName: randomLanguage.description,
      allCorrectCountryNames: randomLanguage.countryDetails.map(country => country.name)
    }
  };

  console.log('Generated language question:', question.id, 'Correct answer:', correctCountry.name);
  return question;
}; 