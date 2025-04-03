import mongoose from 'mongoose';
import { getRandomLanguageQuestion } from '../controllers/quiz/generators/languageQuestions';
import Language from '../models/Language';
import Country from '../models/Country';
import { QuizFilters, QuizQuestion } from '../controllers/quiz/types';

// Mock Mongoose models using the correct path
jest.mock('../models/Language');
jest.mock('../models/Country');

describe('Language Questions Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate a valid language question with no filters', async () => {
    // Mock data for a language with one country
    const mockLanguage = {
      _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8b30'),
      imageUrl: 'https://example.com/language-jp.jpg',
      description: 'Japanese script (Hiragana/Katakana/Kanji)',
      countries: [new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a11')],
      countryDetails: [
        {
          _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a11'),
          name: 'Japan',
          capital: 'Tokyo',
          continent: 'Asia',
          in_geoguessr: true,
          code: 'jp'
        }
      ]
    };

    // Mock data for incorrect countries
    const mockIncorrectCountries = [
      {
        _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a12'),
        name: 'South Korea',
        capital: 'Seoul',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'kr'
      },
      {
        _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a13'),
        name: 'China',
        capital: 'Beijing',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'cn'
      },
      {
        _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a14'),
        name: 'Taiwan',
        capital: 'Taipei',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'tw'
      }
    ];

    // Mock Language.aggregate
    (Language.aggregate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockLanguage])
    });

    // Mock Country.aggregate for incorrect options
    (Country.aggregate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockIncorrectCountries)
    });

    // Call the function being tested
    const question: QuizQuestion = await getRandomLanguageQuestion();

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('Which country is primarily associated with this language/script?');
    expect(question.imageUrl).toBe('https://example.com/language-jp.jpg');
    expect(question.options.length).toBe(4);
    
    // Check that one option is correct
    const correctOptions = question.options.filter(option => option.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // The correct option should be the language's country
    const correctOption = correctOptions[0];
    expect(correctOption.id).toBe('60d5ec49f1d1a11a0c5e8a11');
    expect(correctOption.text).toBe('Japan');

    // Check that there are 3 incorrect options
    const incorrectOptions = question.options.filter(option => !option.isCorrect);
    expect(incorrectOptions.length).toBe(3);
    
    // Check that incorrect options contain the expected countries
    const incorrectCountryNames = incorrectOptions.map(option => option.text);
    expect(incorrectCountryNames).toEqual(expect.arrayContaining(['South Korea', 'China', 'Taiwan']));
    
    // Check metadata
    expect(question.metadata).toBeDefined();
    expect(question.metadata?.allCorrectCountryNames).toEqual(['Japan']);
    expect(question.metadata?.languageName).toBe('Japanese script (Hiragana/Katakana/Kanji)');
  });

  test('should apply continent filter correctly', async () => {
    // Mock data for an European language (e.g., Greek)
    const mockEuropeanLanguage = {
      _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8b32'),
      imageUrl: 'https://example.com/language-gr.jpg',
      description: 'Greek alphabet',
      countries: [new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a15')],
      countryDetails: [
        {
          _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a15'),
          name: 'Greece',
          capital: 'Athens',
          continent: 'Europe',
          in_geoguessr: true,
          code: 'gr'
        }
      ]
    };

    // Mock data for incorrect European countries
    const mockIncorrectEuropeanCountries = [
      {
        _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a16'),
        name: 'Italy',
        capital: 'Rome',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'it'
      },
      {
        _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a17'),
        name: 'Spain',
        capital: 'Madrid',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'es'
      },
      {
        _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a18'),
        name: 'France',
        capital: 'Paris',
        continent: 'Europe',
        in_geoguessr: true,
        code: 'fr'
      }
    ];

    // Mock Language.aggregate
    (Language.aggregate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockEuropeanLanguage])
    });

    // Mock Country.aggregate for incorrect options
    (Country.aggregate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockIncorrectEuropeanCountries)
    });

    // Define filter for Europe continent
    const filters: QuizFilters = {
      continent: 'Europe'
    };

    // Call the function being tested with continent filter
    const question: QuizQuestion = await getRandomLanguageQuestion(filters);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('Which country is primarily associated with this language/script?');
    expect(question.imageUrl).toBe('https://example.com/language-gr.jpg');
    expect(question.options.length).toBe(4);
    
    // Check that one option is correct
    const correctOptions = question.options.filter(option => option.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // The correct option should be Greece
    const correctOption = correctOptions[0];
    expect(correctOption.id).toBe('60d5ec49f1d1a11a0c5e8a15');
    expect(correctOption.text).toBe('Greece');

    // Check that there are 3 incorrect options from Europe
    const incorrectOptions = question.options.filter(option => !option.isCorrect);
    expect(incorrectOptions.length).toBe(3);
    
    // Check that incorrect options contain the expected European countries
    const incorrectCountryNames = incorrectOptions.map(option => option.text);
    expect(incorrectCountryNames).toEqual(expect.arrayContaining(['Italy', 'Spain', 'France']));
    
    // Check metadata
    expect(question.metadata).toBeDefined();
    expect(question.metadata?.allCorrectCountryNames).toEqual(['Greece']);
    expect(question.metadata?.languageName).toBe('Greek alphabet');
  });

  test('should handle previous entity IDs correctly', async () => {
    // Mock data for a language
    const mockLanguage = {
      _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8b33'),
      imageUrl: 'https://example.com/language-th.jpg',
      description: 'Thai script',
      countries: [new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a19')],
      countryDetails: [
        {
          _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a19'),
          name: 'Thailand',
          capital: 'Bangkok',
          continent: 'Asia',
          in_geoguessr: true,
          code: 'th'
        }
      ]
    };

    // Mock data for incorrect countries
    const mockIncorrectCountries = [
      {
        _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a20'),
        name: 'Vietnam',
        capital: 'Hanoi',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'vn'
      },
      {
        _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a21'),
        name: 'Malaysia',
        capital: 'Kuala Lumpur',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'my'
      },
      {
        _id: new mongoose.Types.ObjectId('60d5ec49f1d1a11a0c5e8a22'),
        name: 'Cambodia',
        capital: 'Phnom Penh',
        continent: 'Asia',
        in_geoguessr: true,
        code: 'kh'
      }
    ];

    // Mock Language.aggregate
    (Language.aggregate as jest.Mock).mockImplementation((pipeline) => {
      // Check that the previous entity IDs are being excluded
      const exclusionStage = pipeline.find((stage: any) => stage.$match?._id?.$nin);
      expect(exclusionStage).toBeDefined();
      const excludedIdsAsObjectIds = ['60d5ec49f1d1a11a0c5e8b31', '60d5ec49f1d1a11a0c5e8b32'].map(id => new mongoose.Types.ObjectId(id));
      expect(exclusionStage.$match._id.$nin).toEqual(expect.arrayContaining(excludedIdsAsObjectIds));
      
      // Return the object with the mock exec function
      return {
        exec: jest.fn().mockResolvedValue([mockLanguage])
      };
    });

    // Mock Country.aggregate for incorrect options
    (Country.aggregate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockIncorrectCountries)
    });

    // Call the function being tested with previous entity IDs (valid ObjectId strings)
    const previousEntityIds = ['60d5ec49f1d1a11a0c5e8b31', '60d5ec49f1d1a11a0c5e8b32'];
    const question: QuizQuestion = await getRandomLanguageQuestion(undefined, previousEntityIds);

    // Assertions
    expect(question).toBeDefined();
    expect(question.question).toBe('Which country is primarily associated with this language/script?');
    expect(question.imageUrl).toBe('https://example.com/language-th.jpg');
    
    // Check that metadata is correctly set
    expect(question.metadata).toBeDefined();
    expect(question.metadata?.allCorrectCountryNames).toEqual(['Thailand']);
    expect(question.metadata?.languageName).toBe('Thai script');
  });
}); 