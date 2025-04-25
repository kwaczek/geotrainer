import mongoose from 'mongoose';
import Country from '../../../models/Country';
import { QuizFilters, QuizQuestion } from '../types';

/**
 * Generate a random currency question
 */
export async function getRandomCurrencyQuestion(filters?: QuizFilters, previousEntityIds: string[] = []): Promise<QuizQuestion> {
  // We need to find countries that have currency information
  let baseQuery: any = { currency: { $exists: true, $ne: null, $not: { $size: 0 } } };

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

  // Handle case where no countries are available with exclusion filter
  let correctCountry;
  if (!correctCountryCandidates || correctCountryCandidates.length === 0) {
    if (previousEntityIds.length > 0) {
      console.log('No countries found with exclusion filter for correct answer, retrying without excluding previous entities');
      const fallbackEntities = await Country.aggregate([
        { $match: baseQuery },
        { $sample: { size: 1 } }
      ]);

      if (!fallbackEntities || fallbackEntities.length === 0) {
        throw new Error('No countries found with the specified filters');
      }

      correctCountry = fallbackEntities[0];
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
      currency: { $exists: true, $ne: null, $not: { $size: 0 } },
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

  // Get the primary currency for the question
  const primaryCurrency = correctCountry.currency && correctCountry.currency.length > 0
    ? correctCountry.currency[0]
    : { name: 'Unknown', symbol: '', code: '' };

  // Format the currency display text in a more elegant way
  let currencyDisplay = '';

  // If we have a name, use it as the primary identifier
  if (primaryCurrency.name && primaryCurrency.name.trim() !== '') {
    // Extract only the last word of the currency name to avoid giving away the country name
    const currencyNameParts = primaryCurrency.name.trim().split(' ');
    const lastWord = currencyNameParts[currencyNameParts.length - 1];

    // Capitalize the last word
    const capitalizedLastWord = lastWord.charAt(0).toUpperCase() + lastWord.slice(1);
    currencyDisplay = capitalizedLastWord;

    // Add code in parentheses if available
    if (primaryCurrency.code && primaryCurrency.code.trim() !== '') {
      currencyDisplay += ` (${primaryCurrency.code})`;
    }

    // Add symbol as a separate element if available and different from code
    if (primaryCurrency.symbol &&
        primaryCurrency.symbol.trim() !== '' &&
        primaryCurrency.symbol !== primaryCurrency.code) {
      currencyDisplay += ` • Symbol: ${primaryCurrency.symbol}`;
    }
  }
  // If no name but we have a code, use that
  else if (primaryCurrency.code && primaryCurrency.code.trim() !== '') {
    currencyDisplay = primaryCurrency.code;

    // Add symbol if available and different from code
    if (primaryCurrency.symbol &&
        primaryCurrency.symbol.trim() !== '' &&
        primaryCurrency.symbol !== primaryCurrency.code) {
      currencyDisplay += ` • Symbol: ${primaryCurrency.symbol}`;
    }
  }
  // If only symbol is available, use that
  else if (primaryCurrency.symbol && primaryCurrency.symbol.trim() !== '') {
    currencyDisplay = `Symbol: ${primaryCurrency.symbol}`;
  }
  // Fallback for unknown currency
  else {
    currencyDisplay = 'Unknown Currency';
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

  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: `Which country uses the currency ${currencyDisplay}?`,
    options: allOptions,
    metadata: {
      allCurrencies: correctCountry.currency || [],
      countryId: correctCountry._id.toString(),
      entityId: correctCountry._id.toString() // Add entityId for tracking previous questions
    }
  };
}
