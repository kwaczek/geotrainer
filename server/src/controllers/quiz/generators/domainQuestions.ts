import mongoose from 'mongoose';
import Country from '../../../models/Country';
import { QuizFilters, QuizQuestion } from '../types';

/**
 * Generate a random domain question
 */
export async function getRandomDomainQuestion(filters?: QuizFilters, previousEntityIds: string[] = []): Promise<QuizQuestion> {
  // We need to find countries that have domain information
  let baseQuery: any = { domain: { $exists: true, $ne: null, $not: { $size: 0 } } };

  // Apply filters if provided
  if (filters) {
    if (filters.continent && filters.continent !== 'all') {
      baseQuery.continent = filters.continent;
    }

    if (filters.in_geoguessr) {
      baseQuery.in_geoguessr = true;
    }
  }

  // Create a query for the correct answer that excludes previously seen entities
  let correctAnswerQuery = { ...baseQuery };

  // Filter out countries that were used in previous questions ONLY for the correct answer
  if (previousEntityIds.length > 0) {
    // Convert string IDs to ObjectId for MongoDB comparison
    const objectIds = previousEntityIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return id; // If conversion fails, keep the string (for cases like auto-generated IDs)
      }
    });
    correctAnswerQuery._id = { $nin: objectIds };
  }

  // Get a random country for the correct answer that hasn't been used before
  const correctCountryCandidates = await Country.aggregate([
    { $match: correctAnswerQuery },
    { $sample: { size: 1 } }
  ]);

  // If no countries available with exclusion filter, try without it
  let correctCountry;
  if (!correctCountryCandidates || correctCountryCandidates.length === 0) {
    if (previousEntityIds.length > 0) {
      console.log('No countries found with exclusion filter for correct answer, retrying without excluding previous countries');
      const fallbackCountries = await Country.aggregate([
        { $match: baseQuery },
        { $sample: { size: 1 } }
      ]);

      if (!fallbackCountries || fallbackCountries.length === 0) {
        throw new Error('No countries found with the specified filters');
      }

      correctCountry = fallbackCountries[0];
    } else {
      throw new Error('No countries found with the specified filters');
    }
  } else {
    correctCountry = correctCountryCandidates[0];
  }

  // Now get random countries for incorrect options - don't exclude previous entity IDs
  // but do exclude the current correct answer
  const incorrectOptionsQuery = {
    ...baseQuery,
    _id: { $ne: correctCountry._id } // Only exclude the current correct answer
  };

  const incorrectCountries = await Country.aggregate([
    { $match: incorrectOptionsQuery },
    { $sample: { size: 3 } }
  ]);

  // If we couldn't find enough incorrect options, try with fewer filters
  if (incorrectCountries.length < 3) {
    console.log(`Only found ${incorrectCountries.length} incorrect countries with filters, getting more with relaxed filters`);

    // Simplified query that just excludes the correct answer
    const fallbackQuery: any = {
      domain: { $exists: true, $ne: null, $not: { $size: 0 } },
      _id: { $ne: correctCountry._id }
    };

    // Keep any in_geoguessr filter if it was specified
    if (filters?.in_geoguessr) {
      fallbackQuery.in_geoguessr = true;
    }

    const additionalCountries = await Country.aggregate([
      { $match: fallbackQuery },
      { $sample: { size: 3 - incorrectCountries.length } }
    ]);

    incorrectCountries.push(...additionalCountries);
  }

  // Combine correct and incorrect options
  const allOptions = [
    {
      id: correctCountry._id.toString(),
      text: correctCountry.name,
      isCorrect: true
    },
    ...incorrectCountries.map(country => ({
      id: country._id.toString(),
      text: country.name,
      isCorrect: false
    }))
  ];

  // Shuffle the options
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }

  // Get the primary domain for the question
  const primaryDomain = correctCountry.domain && correctCountry.domain.length > 0
    ? correctCountry.domain[0]
    : '';

  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: `Which country uses the domain "${primaryDomain}"?`,
    options: allOptions,
    metadata: {
      allDomains: correctCountry.domain || [],
      countryId: correctCountry._id.toString(),
      entityId: correctCountry._id.toString() // Add entityId for tracking previous questions
    }
  };
}
