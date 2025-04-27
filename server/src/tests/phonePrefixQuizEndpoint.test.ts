import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Country from '../models/Country';
import { QuizType } from '../models/QuizResult';
import { getRandomPhonePrefixQuestion } from '../controllers/quiz/generators/phonePrefixQuestions';
import quizRoutes from '../routes/index';

let mongoServer: MongoMemoryServer;
let app: express.Application;

// Mock data for testing
const mockCountries = [
  {
    name: 'United States',
    capital: 'Washington D.C.',
    continent: 'North America',
    in_geoguessr: true,
    phone_prefix: '1'
  },
  {
    name: 'United Kingdom',
    capital: 'London',
    continent: 'Europe',
    in_geoguessr: true,
    phone_prefix: '44'
  },
  {
    name: 'Japan',
    capital: 'Tokyo',
    continent: 'Asia',
    in_geoguessr: true,
    phone_prefix: '81'
  },
  {
    name: 'Australia',
    capital: 'Canberra',
    continent: 'Oceania',
    in_geoguessr: true,
    phone_prefix: '61'
  }
];

beforeAll(async () => {
  // Set up MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Seed the database with mock data
  await Country.insertMany(mockCountries);

  // Create Express app
  app = express();
  app.use(express.json());

  // Add routes
  app.use('/api', quizRoutes);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Phone Prefix Quiz Generator', () => {
  test('getRandomPhonePrefixQuestion - should generate a valid question', async () => {
    const question = await getRandomPhonePrefixQuestion();

    expect(question).toHaveProperty('id');
    expect(question).toHaveProperty('question');
    expect(question).toHaveProperty('options');

    // Verify question content
    expect(question.question).toMatch(/Which country uses the phone prefix "\+\d+"\?/);

    // Verify options
    expect(question.options).toHaveLength(4);
    expect(question.options[0]).toHaveProperty('id');
    expect(question.options[0]).toHaveProperty('text');
    expect(question.options[0]).toHaveProperty('isCorrect');

    // Verify metadata
    expect(question.metadata).toHaveProperty('phonePrefix');
    expect(question.metadata).toHaveProperty('countryId');
    expect(question.metadata).toHaveProperty('entityId');

    // Verify one option is correct
    const correctOptions = question.options.filter(option => option.isCorrect);
    expect(correctOptions).toHaveLength(1);
  });

  test('getRandomPhonePrefixQuestion with filters - should apply filters correctly', async () => {
    const question = await getRandomPhonePrefixQuestion({ continent: 'Europe' });

    // Find the correct option
    const correctOption = question.options.find(option => option.isCorrect);

    // The correct answer should be a European country (in this case, United Kingdom)
    expect(correctOption?.text).toBe('United Kingdom');
  });

  test('getRandomPhonePrefixQuestion with previous entities - should exclude previous entities', async () => {
    // Get all countries with phone prefixes
    const countries = await Country.find({
      phone_prefix: { $exists: true, $ne: null }
    }).where('phone_prefix').ne('');

    // Get IDs of all countries except United Kingdom
    const previousEntityIds = countries
      .filter((country: any) => country.name !== 'United Kingdom')
      .map((country: any) => country._id.toString());

    // Generate a question excluding all countries except United Kingdom
    const question = await getRandomPhonePrefixQuestion(undefined, previousEntityIds);

    // Find the correct option
    const correctOption = question.options.find(option => option.isCorrect);

    // The correct answer should be United Kingdom since all others were excluded
    expect(correctOption?.text).toBe('United Kingdom');
  });
});
