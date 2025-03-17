import mongoose from 'mongoose';
import { getRandomBollardQuestion } from '../controllers/quiz/generators/bollardQuestions';
import Bollard from '../models/Bollard';
import Country from '../models/Country';
import { QuizFilters } from '../controllers/quiz/types';

// Mock the Bollard and Country models
jest.mock('../models/Bollard', () => ({
  aggregate: jest.fn()
}));

jest.mock('../models/Country', () => ({
  aggregate: jest.fn()
}));

describe('Bollard Questions Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate a valid bollard question with no filters', async () => {
    // Mock data for a bollard with multiple countries
    const mockBollard = {
      _id: 'bollard-1',
      imageUrl: 'https://example.com/bollard1.jpg',
      description: 'A typical French bollard',
      googleMapsUrl: 'https://maps.google.com/?q=Paris',
      countries: ['country-1', 'country-2'],
      countryDetails: [
        {
          _id: 'country-1',
          name: 'France',
          capital: 'Paris',
          continent: 'Europe',
          in_geoguessr: true,
          code: 'fr'
        },
        {
          _id: 'country-2',
          name: 'Belgium',
          capital: 'Brussels',
          continent: 'Europe',
          in_geoguessr: true,
          code: 'be'
        }
      ]
    };

    // Mock data for incorrect countries
    const mockIncorrectCountries = [
      {
        _id: 'country-3',
        name: 'Germany',
        capital: 'Berlin',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'de'
      },
      {
        _id: 'country-4',
        name: 'Italy',
        capital: 'Rome',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'it'
      },
      {
        _id: 'country-5',
        name: 'Spain',
        capital: 'Madrid',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'es'
      }
    ];

    // Mock the Bollard.aggregate function
    (Bollard.aggregate as jest.Mock).mockImplementation((pipeline) => {
      // Return an object that has a lookup method
      return {
        lookup: jest.fn().mockResolvedValue([mockBollard])
      };
    });

    // Mock the Country.aggregate function for incorrect options
    (Country.aggregate as jest.Mock).mockResolvedValue(mockIncorrectCountries);

    // Call the function being tested
    const question = await getRandomBollardQuestion();

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('In which country can you find this bollard?');
    expect(question.imageUrl).toBe('https://example.com/bollard1.jpg');
    expect(question.options.length).toBe(4);
    
    // Check that one option is correct
    const correctOptions = question.options.filter(option => option.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // The correct option should be one of the bollard's countries
    const correctOption = correctOptions[0];
    expect(['country-1', 'country-2']).toContain(correctOption.id);
    expect(['France', 'Belgium']).toContain(correctOption.text);

    // Check that there are 3 incorrect options
    const incorrectOptions = question.options.filter(option => !option.isCorrect);
    expect(incorrectOptions.length).toBe(3);
    
    // Check that incorrect options contain the expected countries
    const incorrectCountryNames = incorrectOptions.map(option => option.text);
    expect(incorrectCountryNames).toEqual(expect.arrayContaining(['Germany', 'Italy', 'Spain']));
    
    // Check that metadata contains all correct countries
    expect(question.metadata).toBeDefined();
    expect(question.metadata?.allCorrectCountryNames).toEqual(['France', 'Belgium']);
    expect(question.metadata?.bollardId).toBe('bollard-1');
  });

  test('should apply continent filter correctly', async () => {
    // Mock data for an Asian bollard
    const mockAsianBollard = {
      _id: 'bollard-2',
      imageUrl: 'https://example.com/bollard2.jpg',
      description: 'A typical Japanese bollard',
      googleMapsUrl: 'https://maps.google.com/?q=Tokyo',
      countries: ['country-6'],
      countryDetails: [
        {
          _id: 'country-6',
          name: 'Japan',
          capital: 'Tokyo',
          continent: 'Asia',
          in_geoguessr: true,
          code: 'jp'
        }
      ]
    };

    // Mock data for incorrect Asian countries
    const mockIncorrectAsianCountries = [
      {
        _id: 'country-7',
        name: 'China',
        capital: 'Beijing',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'cn'
      },
      {
        _id: 'country-8',
        name: 'South Korea',
        capital: 'Seoul',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'kr'
      },
      {
        _id: 'country-9',
        name: 'Thailand',
        capital: 'Bangkok',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'th'
      }
    ];

    // Mock the Bollard.aggregate function with continent filter
    (Bollard.aggregate as jest.Mock).mockImplementation((pipeline) => {
      // Verify that the continent filter is being applied
      const lookupStage = pipeline.find((stage: any) => stage.$lookup?.as === 'countryDetails');
      const matchStage = pipeline.find((stage: any) => stage.$match?.['countryDetails.continent'] === 'Asia');
      
      expect(lookupStage).toBeDefined();
      expect(matchStage).toBeDefined();
      
      // Return an object that has a lookup method
      return {
        lookup: jest.fn().mockResolvedValue([mockAsianBollard])
      };
    });

    // Mock the Country.aggregate function for incorrect options
    (Country.aggregate as jest.Mock).mockResolvedValue(mockIncorrectAsianCountries);

    // Define filter for Asia continent
    const filters: QuizFilters = {
      continent: 'Asia'
    };

    // Call the function being tested with continent filter
    const question = await getRandomBollardQuestion(filters);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('In which country can you find this bollard?');
    expect(question.imageUrl).toBe('https://example.com/bollard2.jpg');
    expect(question.options.length).toBe(4);
    
    // Check that one option is correct
    const correctOptions = question.options.filter(option => option.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // The correct option should be Japan
    const correctOption = correctOptions[0];
    expect(correctOption.id).toBe('country-6');
    expect(correctOption.text).toBe('Japan');

    // Check that there are 3 incorrect options from Asia
    const incorrectOptions = question.options.filter(option => !option.isCorrect);
    expect(incorrectOptions.length).toBe(3);
    
    // Check that incorrect options contain the expected Asian countries
    const incorrectCountryNames = incorrectOptions.map(option => option.text);
    expect(incorrectCountryNames).toEqual(expect.arrayContaining(['China', 'South Korea', 'Thailand']));
    
    // Check that metadata is correctly set
    expect(question.metadata).toBeDefined();
    expect(question.metadata?.allCorrectCountryNames).toEqual(['Japan']);
    expect(question.metadata?.bollardId).toBe('bollard-2');
  });
}); 