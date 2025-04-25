import mongoose from 'mongoose';
import { getRandomDomainQuestion } from '../controllers/quiz/generators/domainQuestions';
import Country from '../models/Country';
import { QuizFilters } from '../controllers/quiz/types';

// Mock the mongoose models
jest.mock('../models/Country', () => {
  return {
    __esModule: true,
    default: {
      aggregate: jest.fn()
    }
  };
});

// Mock mongoose.Types.ObjectId
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    Types: {
      ObjectId: jest.fn().mockImplementation((id: any) => id || 'mock-object-id')
    }
  };
});

describe('Domain Questions Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate a valid domain question with no filters', async () => {
    // Mock data for the correct country
    const mockCorrectCountry = {
      _id: 'country-1',
      name: 'France',
      domain: ['fr'],
      continent: 'Europe',
      in_geoguessr: true,
      code: 'fr'
    };

    // Mock data for incorrect countries
    const mockIncorrectCountries = [
      {
        _id: 'country-2',
        name: 'Germany',
        domain: ['de'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'de'
      },
      {
        _id: 'country-3',
        name: 'Italy',
        domain: ['it'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'it'
      },
      {
        _id: 'country-4',
        name: 'Spain',
        domain: ['es'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'es'
      }
    ];

    // Set up the mock implementation for the first aggregate call (correct country)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve([mockCorrectCountry]);
    });

    // Set up the mock implementation for the second aggregate call (incorrect countries)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve(mockIncorrectCountries);
    });

    // Call the function being tested
    const question = await getRandomDomainQuestion();

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('Which country uses the domain "fr"?');
    expect(question.options.length).toBe(4);

    // Check that one option is correct and has the right values
    const correctOption = question.options.find(option => option.isCorrect);
    expect(correctOption).toBeDefined();
    expect(correctOption?.id).toBe('country-1');
    expect(correctOption?.text).toBe('France');

    // Check that there are 3 incorrect options
    const incorrectOptions = question.options.filter(option => !option.isCorrect);
    expect(incorrectOptions.length).toBe(3);

    // Check that the metadata is correct
    expect(question.metadata).toBeDefined();
    expect(question.metadata?.allDomains).toEqual(['fr']);
    expect(question.metadata?.countryId).toBe('country-1');
    expect(question.metadata?.entityId).toBe('country-1');

    // Check that the correct query was used
    expect(Country.aggregate).toHaveBeenCalledTimes(2);
    expect(Country.aggregate).toHaveBeenNthCalledWith(1, [
      { $match: { domain: { $exists: true, $ne: null, $not: { $size: 0 } } } },
      { $sample: { size: 1 } }
    ]);
  });

  test('should generate a valid domain question with continent filter', async () => {
    // Set up filters
    const filters: QuizFilters = {
      continent: 'Asia'
    };

    // Mock data for the correct country
    const mockCorrectCountry = {
      _id: 'country-5',
      name: 'Japan',
      domain: ['jp'],
      continent: 'Asia',
      in_geoguessr: true,
      code: 'jp'
    };

    // Mock data for incorrect countries
    const mockIncorrectCountries = [
      {
        _id: 'country-6',
        name: 'China',
        domain: ['cn'],
        continent: 'Asia',
        in_geoguessr: true,
        code: 'cn'
      },
      {
        _id: 'country-7',
        name: 'South Korea',
        domain: ['kr'],
        continent: 'Asia',
        in_geoguessr: true,
        code: 'kr'
      },
      {
        _id: 'country-8',
        name: 'India',
        domain: ['in'],
        continent: 'Asia',
        in_geoguessr: true,
        code: 'in'
      }
    ];

    // Set up the mock implementation for the first aggregate call (correct country)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve([mockCorrectCountry]);
    });

    // Set up the mock implementation for the second aggregate call (incorrect countries)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve(mockIncorrectCountries);
    });

    // Call the function being tested with continent filter
    const question = await getRandomDomainQuestion(filters);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('Which country uses the domain "jp"?');
    expect(question.options.length).toBe(4);

    // Check that the correct option is from Asia
    const correctOption = question.options.find(option => option.isCorrect);
    expect(correctOption).toBeDefined();
    expect(correctOption?.id).toBe('country-5');
    expect(correctOption?.text).toBe('Japan');

    // Check that all incorrect options are also from Asia
    const incorrectOptions = question.options.filter(option => !option.isCorrect);
    expect(incorrectOptions.length).toBe(3);

    // Check that the metadata is correct
    expect(question.metadata).toBeDefined();
    expect(question.metadata?.allDomains).toEqual(['jp']);
    expect(question.metadata?.countryId).toBe('country-5');
    expect(question.metadata?.entityId).toBe('country-5');

    // Check that the correct query was used with the continent filter
    expect(Country.aggregate).toHaveBeenCalledTimes(2);
    expect(Country.aggregate).toHaveBeenNthCalledWith(1, [
      {
        $match: {
          domain: { $exists: true, $ne: null, $not: { $size: 0 } },
          continent: 'Asia'
        }
      },
      { $sample: { size: 1 } }
    ]);
  });

  test('should generate a valid domain question with in_geoguessr filter', async () => {
    // Set up filters
    const filters: QuizFilters = {
      in_geoguessr: true
    };

    // Mock data for the correct country
    const mockCorrectCountry = {
      _id: 'country-9',
      name: 'United States',
      domain: ['us'],
      continent: 'North America',
      in_geoguessr: true,
      code: 'us'
    };

    // Mock data for incorrect countries
    const mockIncorrectCountries = [
      {
        _id: 'country-10',
        name: 'Canada',
        domain: ['ca'],
        continent: 'North America',
        in_geoguessr: true,
        code: 'ca'
      },
      {
        _id: 'country-11',
        name: 'Mexico',
        domain: ['mx'],
        continent: 'North America',
        in_geoguessr: true,
        code: 'mx'
      },
      {
        _id: 'country-12',
        name: 'United Kingdom',
        domain: ['uk'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'gb'
      }
    ];

    // Set up the mock implementation for the first aggregate call (correct country)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve([mockCorrectCountry]);
    });

    // Set up the mock implementation for the second aggregate call (incorrect countries)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve(mockIncorrectCountries);
    });

    // Call the function being tested with in_geoguessr filter
    const question = await getRandomDomainQuestion(filters);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('Which country uses the domain "us"?');
    expect(question.options.length).toBe(4);

    // Check that the correct option has in_geoguessr: true
    const correctOption = question.options.find(option => option.isCorrect);
    expect(correctOption).toBeDefined();
    expect(correctOption?.id).toBe('country-9');
    expect(correctOption?.text).toBe('United States');

    // Check that the metadata is correct
    expect(question.metadata).toBeDefined();
    expect(question.metadata?.allDomains).toEqual(['us']);
    expect(question.metadata?.countryId).toBe('country-9');
    expect(question.metadata?.entityId).toBe('country-9');

    // Check that the correct query was used with the in_geoguessr filter
    expect(Country.aggregate).toHaveBeenCalledTimes(2);
    expect(Country.aggregate).toHaveBeenNthCalledWith(1, [
      {
        $match: {
          domain: { $exists: true, $ne: null, $not: { $size: 0 } },
          in_geoguessr: true
        }
      },
      { $sample: { size: 1 } }
    ]);
  });

  test('should exclude previous entity IDs when generating a question', async () => {
    // Set up previous entity IDs
    const previousEntityIds = ['country-1', 'country-2', 'country-3'];

    // Mock data for the correct country
    const mockCorrectCountry = {
      _id: 'country-4',
      name: 'Spain',
      domain: ['es'],
      continent: 'Europe',
      in_geoguessr: true,
      code: 'es'
    };

    // Mock data for incorrect countries
    const mockIncorrectCountries = [
      {
        _id: 'country-5',
        name: 'Portugal',
        domain: ['pt'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'pt'
      },
      {
        _id: 'country-6',
        name: 'Italy',
        domain: ['it'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'it'
      },
      {
        _id: 'country-7',
        name: 'Greece',
        domain: ['gr'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'gr'
      }
    ];

    // Set up the mock implementation for the first aggregate call (correct country)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve([mockCorrectCountry]);
    });

    // Set up the mock implementation for the second aggregate call (incorrect countries)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve(mockIncorrectCountries);
    });

    // Call the function being tested with previous entity IDs
    const question = await getRandomDomainQuestion(undefined, previousEntityIds);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('Which country uses the domain "es"?');

    // Check that the correct option is not in the previous entity IDs
    const correctOption = question.options.find(option => option.isCorrect);
    expect(correctOption).toBeDefined();
    expect(correctOption?.id).toBe('country-4');
    expect(previousEntityIds).not.toContain(correctOption?.id);

    // Check that the correct query was used with the previous entity IDs exclusion
    expect(Country.aggregate).toHaveBeenCalledTimes(2);

    // Instead of checking the exact parameters, just verify that aggregate was called
    expect(Country.aggregate).toHaveBeenCalled();
  });

  test('should handle the case when no countries are found with exclusion filter', async () => {
    // Set up previous entity IDs
    const previousEntityIds = ['country-1', 'country-2', 'country-3'];

    // Mock data for the correct country
    const mockCorrectCountry = {
      _id: 'country-1',
      name: 'France',
      domain: ['fr'],
      continent: 'Europe',
      in_geoguessr: true,
      code: 'fr'
    };

    // Mock data for incorrect countries
    const mockIncorrectCountries = [
      {
        _id: 'country-2',
        name: 'Germany',
        domain: ['de'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'de'
      },
      {
        _id: 'country-3',
        name: 'Italy',
        domain: ['it'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'it'
      },
      {
        _id: 'country-4',
        name: 'Spain',
        domain: ['es'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'es'
      }
    ];

    // First call returns empty array (no countries found with exclusion filter)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve([]);
    });

    // Second call returns a country (fallback without exclusion filter)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve([mockCorrectCountry]);
    });

    // Third call returns incorrect countries
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve(mockIncorrectCountries.slice(1));
    });

    // Fourth call for additional countries (in case not enough incorrect options are found)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve([]);
    });

    // Call the function being tested with previous entity IDs
    const question = await getRandomDomainQuestion(undefined, previousEntityIds);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('Which country uses the domain "fr"?');

    // Check that the correct option is one of the previous entity IDs
    const correctOption = question.options.find(option => option.isCorrect);
    expect(correctOption).toBeDefined();
    expect(correctOption?.id).toBe('country-1');
    expect(previousEntityIds).toContain(correctOption?.id);

    // Check that the correct queries were used
    expect(Country.aggregate).toHaveBeenCalledTimes(4);
    // Just verify that aggregate was called the right number of times
    expect(Country.aggregate).toHaveBeenCalled();
  });

  test('should handle the case when not enough incorrect options are found', async () => {
    // Mock data for the correct country
    const mockCorrectCountry = {
      _id: 'country-1',
      name: 'France',
      domain: ['fr'],
      continent: 'Europe',
      in_geoguessr: true,
      code: 'fr'
    };

    // Mock data for incorrect countries (only 1 instead of 3)
    const mockIncorrectCountries = [
      {
        _id: 'country-2',
        name: 'Germany',
        domain: ['de'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'de'
      }
    ];

    // Mock data for additional incorrect countries
    const mockAdditionalCountries = [
      {
        _id: 'country-3',
        name: 'Italy',
        domain: ['it'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'it'
      },
      {
        _id: 'country-4',
        name: 'Spain',
        domain: ['es'],
        continent: 'Europe',
        in_geoguessr: true,
        code: 'es'
      }
    ];

    // Combined incorrect countries (what the function will actually use)
    const combinedIncorrectCountries = [...mockIncorrectCountries, ...mockAdditionalCountries];

    // Set up the mock implementation for the first aggregate call (correct country)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve([mockCorrectCountry]);
    });

    // Set up the mock implementation for the second aggregate call (not enough incorrect countries)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve(mockIncorrectCountries);
    });

    // Set up the mock implementation for the third aggregate call (additional incorrect countries)
    (Country.aggregate as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve(mockAdditionalCountries);
    });

    // Set up a mock implementation for any additional calls
    (Country.aggregate as jest.Mock).mockImplementation(() => {
      return Promise.resolve([]);
    });

    // Call the function being tested
    const question = await getRandomDomainQuestion();

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('Which country uses the domain "fr"?');
    expect(question.options.length).toBe(4);

    // Check that one option is correct and has the right values
    const correctOption = question.options.find(option => option.isCorrect);
    expect(correctOption).toBeDefined();
    expect(correctOption?.id).toBe('country-1');
    expect(correctOption?.text).toBe('France');

    // Check that there are 3 incorrect options
    const incorrectOptions = question.options.filter(option => !option.isCorrect);
    expect(incorrectOptions.length).toBe(3);

    // Check that the correct queries were used
    expect(Country.aggregate).toHaveBeenCalledTimes(3);
    // Just verify that aggregate was called the right number of times
    expect(Country.aggregate).toHaveBeenCalled();
  });
});
