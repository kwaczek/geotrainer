import mongoose from 'mongoose';
import { getRandomPoleQuestion } from '../controllers/quiz/generators/poleQuestions';
import Pole from '../models/Pole';
import Country from '../models/Country';
import { QuizFilters } from '../controllers/quiz/types';

// Mock the Pole and Country models
jest.mock('../models/Pole', () => ({
  aggregate: jest.fn()
}));

jest.mock('../models/Country', () => ({
  aggregate: jest.fn()
}));

describe('Pole Questions Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate a valid pole question with no filters', async () => {
    // Mock data for a pole with multiple countries
    const mockPole = {
      _id: 'pole-1',
      imageUrl: 'https://example.com/pole1.jpg',
      description: 'A typical French pole',
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

    // Mock the Pole.aggregate function
    (Pole.aggregate as jest.Mock).mockImplementation((pipeline) => {
      // Return an object that has a lookup method
      return {
        lookup: jest.fn().mockResolvedValue([mockPole])
      };
    });

    // Mock the Country.aggregate function for incorrect options
    (Country.aggregate as jest.Mock).mockResolvedValue(mockIncorrectCountries);

    // Call the function being tested
    const question = await getRandomPoleQuestion();

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('In which country can you find this utility pole?');
    expect(question.imageUrl).toBe('https://example.com/pole1.jpg');
    expect(question.options.length).toBe(4);
    
    // Check that one option is correct
    const correctOptions = question.options.filter(option => option.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // The correct option should be one of the pole's countries
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
    expect(question.metadata?.poleId).toBe('pole-1');
  });

  test('should apply continent filter correctly', async () => {
    // Mock data for an Asian pole
    const mockAsianPole = {
      _id: 'pole-2',
      imageUrl: 'https://example.com/pole2.jpg',
      description: 'A typical Japanese pole',
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

    // Mock the Pole.aggregate function with continent filter
    (Pole.aggregate as jest.Mock).mockImplementation((pipeline) => {
      // Verify that the continent filter is being applied
      const lookupStage = pipeline.find((stage: any) => stage.$lookup?.as === 'countryDetails');
      const matchStage = pipeline.find((stage: any) => stage.$match?.['countryDetails.continent'] === 'Asia');
      
      expect(lookupStage).toBeDefined();
      expect(matchStage).toBeDefined();
      
      // Return an object that has a lookup method
      return {
        lookup: jest.fn().mockResolvedValue([mockAsianPole])
      };
    });

    // Mock the Country.aggregate function for incorrect options
    (Country.aggregate as jest.Mock).mockResolvedValue(mockIncorrectAsianCountries);

    // Define filter for Asia continent
    const filters: QuizFilters = {
      continent: 'Asia'
    };

    // Call the function being tested with continent filter
    const question = await getRandomPoleQuestion(filters);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('In which country can you find this utility pole?');
    expect(question.imageUrl).toBe('https://example.com/pole2.jpg');
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
    expect(question.metadata?.poleId).toBe('pole-2');
  });
}); 