import mongoose from 'mongoose';
import { getRandomLicensePlateQuestion } from '../controllers/quiz/generators/licensePlateQuestions';
import LicensePlate from '../models/LicensePlate';
import Country from '../models/Country';
import { QuizFilters } from '../controllers/quiz/types';

// Mock the LicensePlate and Country models
jest.mock('../models/LicensePlate', () => ({
  aggregate: jest.fn()
}));

jest.mock('../models/Country', () => ({
  aggregate: jest.fn()
}));

describe('License Plate Questions Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate a valid license plate question with no filters', async () => {
    // Mock data for a license plate with one country
    const mockLicensePlate = {
      _id: 'license-plate-1',
      imageUrl: 'https://example.com/license-plate1.jpg',
      description: 'A typical French license plate',
      countries: ['country-1'],
      countryDetails: [
        {
          _id: 'country-1',
          name: 'France',
          capital: 'Paris',
          continent: 'Europe',
          in_geoguessr: true,
          code: 'fr'
        }
      ]
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

    // Mock the LicensePlate.aggregate function
    (LicensePlate.aggregate as jest.Mock).mockImplementation((pipeline) => {
      // Return an object that has a lookup method
      return {
        lookup: jest.fn().mockResolvedValue([mockLicensePlate])
      };
    });

    // Mock the Country.aggregate function for incorrect options
    (Country.aggregate as jest.Mock).mockResolvedValue(mockIncorrectCountries);

    // Call the function being tested
    const question = await getRandomLicensePlateQuestion();

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('In which country can you find this license plate?');
    expect(question.imageUrl).toBe('https://example.com/license-plate1.jpg');
    expect(question.options.length).toBe(4);
    
    // Check that one option is correct
    const correctOptions = question.options.filter(option => option.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // The correct option should be the license plate's country
    const correctOption = correctOptions[0];
    expect(correctOption.id).toBe('country-1');
    expect(correctOption.text).toBe('France');

    // Check that there are 3 incorrect options
    const incorrectOptions = question.options.filter(option => !option.isCorrect);
    expect(incorrectOptions.length).toBe(3);
    
    // Check that incorrect options contain the expected countries
    const incorrectCountryNames = incorrectOptions.map(option => option.text);
    expect(incorrectCountryNames).toEqual(expect.arrayContaining(['Germany', 'Italy', 'Spain']));
    
    // Check that metadata contains the correct country name
    expect(question.metadata).toBeDefined();
    expect(question.metadata?.allCorrectCountryNames).toEqual(['France']);
    expect(question.metadata?.licensePlateId).toBe('license-plate-1');
  });

  test('should apply continent filter correctly', async () => {
    // Mock data for an Asian license plate
    const mockAsianLicensePlate = {
      _id: 'license-plate-2',
      imageUrl: 'https://example.com/license-plate2.jpg',
      description: 'A typical Japanese license plate',
      countries: ['country-5'],
      countryDetails: [
        {
          _id: 'country-5',
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

    // Mock the LicensePlate.aggregate function with continent filter
    (LicensePlate.aggregate as jest.Mock).mockImplementation((pipeline) => {
      // Verify that the continent filter is being applied
      const lookupStage = pipeline.find((stage: any) => stage.$lookup?.as === 'countryDetails');
      const matchStage = pipeline.find((stage: any) => stage.$match?.['countryDetails.continent'] === 'Asia');
      
      expect(lookupStage).toBeDefined();
      expect(matchStage).toBeDefined();
      
      // Return an object that has a lookup method
      return {
        lookup: jest.fn().mockResolvedValue([mockAsianLicensePlate])
      };
    });

    // Mock the Country.aggregate function for incorrect options
    (Country.aggregate as jest.Mock).mockResolvedValue(mockIncorrectAsianCountries);

    // Define filter for Asia continent
    const filters: QuizFilters = {
      continent: 'Asia'
    };

    // Call the function being tested with continent filter
    const question = await getRandomLicensePlateQuestion(filters);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('In which country can you find this license plate?');
    expect(question.imageUrl).toBe('https://example.com/license-plate2.jpg');
    expect(question.options.length).toBe(4);
    
    // Check that one option is correct
    const correctOptions = question.options.filter(option => option.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // The correct option should be Japan
    const correctOption = correctOptions[0];
    expect(correctOption.id).toBe('country-5');
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
    expect(question.metadata?.licensePlateId).toBe('license-plate-2');
  });

  test('should handle previous entity IDs correctly', async () => {
    // Mock data for a license plate
    const mockLicensePlate = {
      _id: 'license-plate-3',
      imageUrl: 'https://example.com/license-plate3.jpg',
      description: 'A typical UK license plate',
      countries: ['country-9'],
      countryDetails: [
        {
          _id: 'country-9',
          name: 'United Kingdom',
          capital: 'London',
          continent: 'Europe',
          in_geoguessr: true,
          code: 'uk'
        }
      ]
    };

    // Mock data for incorrect countries
    const mockIncorrectCountries = [
      {
        _id: 'country-10',
        name: 'Germany',
        capital: 'Berlin',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'de'
      },
      {
        _id: 'country-11',
        name: 'France',
        capital: 'Paris',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'fr'
      },
      {
        _id: 'country-12',
        name: 'Italy',
        capital: 'Rome',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'it'
      }
    ];

    // Mock the LicensePlate.aggregate function to handle previous entity IDs
    (LicensePlate.aggregate as jest.Mock).mockImplementation((pipeline) => {
      // Check that the previous entity IDs are being excluded
      const exclusionStage = pipeline.find((stage: any) => stage.$match?._id?.$nin);
      expect(exclusionStage).toBeDefined();
      expect(exclusionStage.$match._id.$nin).toContain('license-plate-1');
      expect(exclusionStage.$match._id.$nin).toContain('license-plate-2');
      
      // Return an object that has a lookup method
      return {
        lookup: jest.fn().mockResolvedValue([mockLicensePlate])
      };
    });

    // Mock the Country.aggregate function for incorrect options
    (Country.aggregate as jest.Mock).mockResolvedValue(mockIncorrectCountries);

    // Call the function being tested with previous entity IDs
    const question = await getRandomLicensePlateQuestion(undefined, ['license-plate-1', 'license-plate-2']);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('In which country can you find this license plate?');
    expect(question.imageUrl).toBe('https://example.com/license-plate3.jpg');
    
    // Check that metadata is correctly set
    expect(question.metadata).toBeDefined();
    expect(question.metadata?.allCorrectCountryNames).toEqual(['United Kingdom']);
    expect(question.metadata?.licensePlateId).toBe('license-plate-3');
  });
}); 