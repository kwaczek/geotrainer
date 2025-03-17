/**
 * @jest-environment node
 */
/// <reference types="jest" />

// Declare Jest globals to fix linting issues
declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;
declare namespace jest {
  interface Mock<T = any, Y extends any[] = any[]> {
    (...args: Y): T;
    mockImplementation: (fn: (...args: Y) => T) => Mock<T, Y>;
    mockReturnValue: (val: T) => Mock<T, Y>;
    mockReturnThis: () => Mock<T, Y>;
  }
}

import mongoose from 'mongoose';
import { getRandomCapitalQuestion } from '../controllers/quiz/generators/capitalQuestions';
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

describe('Capital Questions Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate a valid capital question with no filters', async () => {
    // Mock data for the correct country
    const mockCorrectCountry = {
      _id: 'country-1',
      name: 'France',
      capital: 'Paris',
      continent: 'Europe',
      in_geoguessr: true,
      code: 'fr'
    };

    // Mock data for incorrect countries
    const mockIncorrectCountries = [
      {
        _id: 'country-2',
        name: 'Germany',
        capital: 'Berlin',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'de'
      },
      {
        _id: 'country-3',
        name: 'Italy',
        capital: 'Rome',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'it'
      },
      {
        _id: 'country-4',
        name: 'Spain',
        capital: 'Madrid',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'es'
      }
    ];

    // Mock the aggregate function to return our test data
    (Country.aggregate as jest.Mock).mockImplementation((pipeline) => {
      const match = pipeline[0].$match;
      
      // If we're querying for all countries except the correct one
      if (match && match._id && match._id.$ne === 'country-1') {
        return Promise.resolve(mockIncorrectCountries);
      }
      
      // For the first call (getting correct country)
      return Promise.resolve([mockCorrectCountry]);
    });

    // Call the function being tested
    const question = await getRandomCapitalQuestion();

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('What is the capital of France?');
    expect(question.options.length).toBe(4);
    
    // Check that one option is correct and has the right values
    const correctOption = question.options.find(option => option.isCorrect);
    expect(correctOption).toBeDefined();
    expect(correctOption?.id).toBe('country-1');
    expect(correctOption?.text).toBe('Paris');

    // Check that there are 3 incorrect options
    const incorrectOptions = question.options.filter(option => !option.isCorrect);
    expect(incorrectOptions.length).toBe(3);
    
    // Check that Country.aggregate was called twice
    // Once for correct answer, once for incorrect options
    expect(Country.aggregate).toHaveBeenCalledTimes(2);
  });

  test('should apply continent filter correctly', async () => {
    // Mock data for countries filtered by continent (Asia)
    const mockAsianCountry = {
      _id: 'country-5',
      name: 'Japan',
      capital: 'Tokyo',
      continent: 'Asia',
      in_geoguessr: true,
      code: 'jp'
    };

    const mockAsianIncorrectCountries = [
      {
        _id: 'country-6',
        name: 'China',
        capital: 'Beijing',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'cn'
      },
      {
        _id: 'country-7',
        name: 'South Korea',
        capital: 'Seoul',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'kr'
      },
      {
        _id: 'country-8',
        name: 'Thailand',
        capital: 'Bangkok',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'th'
      }
    ];

    // Mock the aggregate function to check if continent filter is applied
    (Country.aggregate as jest.Mock).mockImplementation((pipeline) => {
      const match = pipeline[0].$match;
      
      // Verify the continent filter is applied correctly
      expect(match.continent).toBe('Asia');
      
      // If we're querying for incorrect options
      if (match._id && match._id.$ne === 'country-5') {
        return Promise.resolve(mockAsianIncorrectCountries);
      }
      
      // For the first call (getting correct country)
      return Promise.resolve([mockAsianCountry]);
    });

    // Define filter for Asia continent
    const filters: QuizFilters = {
      continent: 'Asia'
    };

    // Call the function being tested with continent filter
    const question = await getRandomCapitalQuestion(filters);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('What is the capital of Japan?');
    expect(question.options.length).toBe(4);
    
    // Check that the correct option is from Asia
    const correctOption = question.options.find(option => option.isCorrect);
    expect(correctOption).toBeDefined();
    expect(correctOption?.id).toBe('country-5');
    expect(correctOption?.text).toBe('Tokyo');

    // Check that all incorrect options are also from Asia
    const incorrectOptions = question.options.filter(option => !option.isCorrect);
    expect(incorrectOptions.length).toBe(3);
    
    // Check that Country.aggregate was called twice with the correct filter
    expect(Country.aggregate).toHaveBeenCalledTimes(2);
  });
}); 