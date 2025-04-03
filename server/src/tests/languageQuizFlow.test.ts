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
    description: 'Japanese script (Hiragana/Katakana/Kanji)',
    countries: [] // Will be filled with ObjectIds after countries are inserted
  },
  {
    imageUrl: 'https://example.com/language-kr.jpg',
    description: 'Korean script (Hangul)',
    countries: [] // Will be filled with ObjectIds after countries are inserted
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
  
  // Update language test data with actual country ObjectIds
  testLanguages[0].countries = [insertedCountries[0]._id]; // Japanese script
  testLanguages[1].countries = [insertedCountries[1]._id]; // Korean script
  
  // Insert test languages
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

describe('Language Quiz Flow', () => {
  test('Complete quiz flow: get question, answer, and verify result', async () => {
    // Step 1: Get a quiz question
    const questionResponse = await request(app).get('/api/quiz-questions/languages');
    
    expect(questionResponse.status).toBe(200);
    expect(questionResponse.body).toHaveProperty('sessionId');
    expect(questionResponse.body).toHaveProperty('question');
    
    const { sessionId } = questionResponse.body;
    const question = questionResponse.body.question;
    
    // Verify question structure specific to languages
    // expect(question).toHaveProperty('description'); // REMOVED: Description is in metadata
    expect(question).toHaveProperty('imageUrl'); // Language questions use image/description as the question body
    expect(question.question).toBe('Which country is primarily associated with this language/script?');
    expect(question.imageUrl).toMatch(/^https:\/\/example\.com\/language-\w+\.jpg$/);
    expect(question.metadata).toHaveProperty('languageName'); // Check for language name in metadata

    // Find the correct option
    const correctOption = question.options.find((opt: any) => opt.isCorrect);
    expect(correctOption).toBeDefined();
    
    // Step 2: Submit the answer (correct answer)
    const answerResponse = await request(app)
      .post('/api/quiz-answers/languages')
      .send({
        sessionId,
        questionId: question.id,
        selectedOptionId: correctOption.id,
        isCorrect: true,
        timeSpentMs: 5000  // 5 seconds
      });
    
    expect(answerResponse.status).toBe(200);
    expect(answerResponse.body).toHaveProperty('success', true);
    expect(answerResponse.body).toHaveProperty('score');
    
    // Step 3: Get the quiz result
    const resultResponse = await request(app)
      .get(`/api/quiz-results/${sessionId}`);
    
    expect(resultResponse.status).toBe(200);
    expect(resultResponse.body).toHaveProperty('success', true);
    expect(resultResponse.body).toHaveProperty('result');
    expect(resultResponse.body.result).toHaveProperty('score');
    expect(resultResponse.body.result).toHaveProperty('attempts');
    
    // Verify the result contains our correct answer
    const attempts = resultResponse.body.result.attempts;
    expect(Array.isArray(attempts)).toBe(true);
    expect(attempts.length).toBe(1);
    expect(attempts[0]).toHaveProperty('isCorrect', true);
    expect(attempts[0]).toHaveProperty('questionId', question.id);
    expect(attempts[0]).toHaveProperty('selectedCountryId', correctOption.id);
    
    // Check that the quiz type is languages
    expect(resultResponse.body.result).toHaveProperty('type', 'languages');
    expect(resultResponse.body.result).toHaveProperty('quizType', 'languages');
  });
}); 