import mongoose from 'mongoose';
import { getRandomRoadSignQuestion } from '../controllers/quiz/generators/roadSignQuestions';
import RoadSign from '../models/RoadSign';
import Country from '../models/Country';
import { QuizFilters } from '../controllers/quiz/types';

// Mock data for a road sign with multiple countries
const mockRoadSign = {
  _id: 'roadsign-1',
  imageUrl: 'https://example.com/roadsign1.jpg',
  description: 'A typical French road sign',
  googleMapsUrl: 'https://maps.google.com/?q=Paris',
  countries: [
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

// Mock data for an Asian road sign
const mockAsianRoadSign = {
  _id: 'roadsign-2',
  imageUrl: 'https://example.com/roadsign2.jpg',
  description: 'A typical Japanese road sign',
  googleMapsUrl: 'https://maps.google.com/?q=Tokyo',
  countries: [
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

// Mock the RoadSign and Country models
jest.mock('../models/RoadSign', () => ({
  aggregate: jest.fn(),
  populate: jest.fn()
}));

jest.mock('../models/Country', () => ({
  aggregate: jest.fn()
}));

describe('Road Sign Questions Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate a valid road sign question with no filters', async () => {
    // Mock the RoadSign.aggregate function for this specific test
    (RoadSign.aggregate as jest.Mock).mockResolvedValue([mockRoadSign]);

    // Mock the Country.aggregate function for incorrect options
    (Country.aggregate as jest.Mock).mockResolvedValue([
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
    ]);

    // Call the function being tested
    const question = await getRandomRoadSignQuestion();

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('Which country does this road sign belong to?');
    expect(question.imageUrl).toBe('https://example.com/roadsign1.jpg');
    expect(question.options.length).toBe(4);
    
    // Check that one option is correct
    const correctOptions = question.options.filter(option => option.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // The correct option should be one of the road sign's countries
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
    expect(question.metadata?.roadSignId).toBe('roadsign-1');
  });

  test('should apply continent filter correctly', async () => {
    // Mock the RoadSign.aggregate function for this specific test
    (RoadSign.aggregate as jest.Mock).mockResolvedValue([mockAsianRoadSign]);

    // Mock the Country.aggregate function for incorrect Asian options
    (Country.aggregate as jest.Mock).mockResolvedValue([
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
    ]);

    // Define filter for Asia continent
    const filters: QuizFilters = {
      continent: 'Asia'
    };

    // Call the function being tested with continent filter
    const question = await getRandomRoadSignQuestion(filters);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('Which country does this road sign belong to?');
    expect(question.imageUrl).toBe('https://example.com/roadsign2.jpg');
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
    expect(question.metadata?.roadSignId).toBe('roadsign-2');
  });
}); 