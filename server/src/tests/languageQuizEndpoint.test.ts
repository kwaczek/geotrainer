/// <reference types="jest" />
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import Country from '../models/Country';
import Language from '../models/Language'; // Import Language model
import { connectDB } from '../config/db';
import routes from '../routes';

// Mock database connections and models
jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined)
}));

let mongoServer: MongoMemoryServer;
let app: express.Application;

// Sample test data for countries
const testCountries = [
  {
    name: 'Japan',
    capital: 'Tokyo',
    continent: 'Asia',
    in_geoguessr: true,
    code: 'jp'
  },
  {
    name: 'South Korea',
    capital: 'Seoul',
    continent: 'Asia',
    in_geoguessr: true,
    code: 'kr'
  },
  {
    name: 'China',
    capital: 'Beijing',
    continent: 'Asia',
    in_geoguessr: true,
    code: 'cn'
  }
];

// Sample test data for languages
const testLanguages: Array<{ 
  imageUrl: string; 
  description: string; 
  countries: mongoose.Types.ObjectId[];
}> = [
  {
    imageUrl: 'https://example.com/language-jp.jpg',
    description: 'Japanese script',
    countries: [] // Will be filled later
  },
  {
    imageUrl: 'https://example.com/language-kr.jpg',
    description: 'Korean script',
    countries: [] // Will be filled later
  }
];

// Set up app and database before tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  app = express();
  app.use(express.json());
  app.use('/api', routes);
  
  const insertedCountries = await Country.insertMany(testCountries) as Array<mongoose.Document & {
    _id: mongoose.Types.ObjectId;
    name: string;
    capital: string;
    continent: string;
    code: string;
  }>;
  
  testLanguages[0].countries = [insertedCountries[0]._id]; // Japan
  testLanguages[1].countries = [insertedCountries[1]._id]; // South Korea
  
  await Language.insertMany(testLanguages);
});

// Clean up after all tests are done
afterAll(async () => {
  if (mongoose.connection) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Language Quiz API Endpoint', () => {
  test('GET /api/quiz-questions/languages should return a valid question', async () => {
    const response = await request(app).get('/api/quiz-questions/languages');
    
    // Check status code
    expect(response.status).toBe(200);
    
    // Check response structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('question');
    
    // Check question structure
    const question = response.body.question;
    expect(question).toHaveProperty('id');
    expect(question).toHaveProperty('question', 'Which country is primarily associated with this language/script?');
    expect(question).toHaveProperty('options');
    expect(question).toHaveProperty('imageUrl');
    expect(question).toHaveProperty('metadata');
    expect(question.metadata).toHaveProperty('languageName');
    expect(question.metadata).toHaveProperty('allCorrectCountryNames');
    
    // Verify options
    expect(Array.isArray(question.options)).toBe(true);
    expect(question.options.length).toBeGreaterThanOrEqual(2); // Need at least 2 options
    
    // Check that only one option is correct
    const correctOptions = question.options.filter((opt: any) => opt.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // Verify image URL format
    expect(question.imageUrl).toMatch(/^https:\/\/example\.com\/language-\w+\.jpg$/);
  });
  
  test('GET /api/quiz-questions/languages with continent parameter', async () => {
    const response = await request(app).get('/api/quiz-questions/languages?filters={\"continent\":\"Asia\"}');
    
    // Check status code
    expect(response.status).toBe(200);
    
    // Check basic structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('question');
    expect(response.body.question).toHaveProperty('question');
    expect(response.body.question).toHaveProperty('options');
    expect(response.body.question).toHaveProperty('imageUrl');
    expect(response.body.question).toHaveProperty('metadata');
    
    // Verify options
    expect(Array.isArray(response.body.question.options)).toBe(true);
    expect(response.body.question.options.length).toBeGreaterThanOrEqual(2); 
    
    // Check that only one option is correct
    const correctOptions = response.body.question.options.filter((opt: any) => opt.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // Verify the question format
    expect(response.body.question.question).toBe('Which country is primarily associated with this language/script?');
    
    // Check image URL format
    expect(response.body.question.imageUrl).toMatch(/^https:\/\/example\.com\/language-\w+\.jpg$/);

    // Ensure the correct country is from the filtered continent (Asia in this case)
    const correctCountryName = response.body.question.metadata.allCorrectCountryNames[0];
    const correctCountry = testCountries.find(c => c.name === correctCountryName);
    expect(correctCountry?.continent).toBe('Asia');
  });
  
  test('POST /api/quiz-answers/languages should process an answer correctly', async () => {
    // First, get a question to answer
    const questionResponse = await request(app).get('/api/quiz-questions/languages');
    const { sessionId } = questionResponse.body;
    const question = questionResponse.body.question;
    
    // Find the correct option
    const correctOption = question.options.find((opt: any) => opt.isCorrect);
    
    // Submit the correct answer
    const answerResponse = await request(app)
      .post('/api/quiz-answers/languages')
      .send({
        sessionId,
        questionId: question.id,
        selectedOptionId: correctOption.id,
        isCorrect: true,
        timeSpentMs: 3000
      });
    
    // Check response
    expect(answerResponse.status).toBe(200);
    expect(answerResponse.body).toHaveProperty('success', true);
    expect(answerResponse.body).toHaveProperty('score');
    expect(answerResponse.body.score).toBe(1);
    expect(answerResponse.body).toHaveProperty('questionCount');
    expect(answerResponse.body.questionCount).toBe(1);
  });
}); 