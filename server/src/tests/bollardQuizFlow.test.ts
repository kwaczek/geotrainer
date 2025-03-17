/// <reference types="jest" />
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import Country from '../models/Country';
import Bollard from '../models/Bollard';
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
    name: 'France',
    capital: 'Paris',
    continent: 'Europe',
    in_geoguessr: true,
    code: 'fr'
  },
  {
    name: 'Germany',
    capital: 'Berlin',
    continent: 'Europe',
    in_geoguessr: true,
    code: 'de'
  },
  {
    name: 'Japan',
    capital: 'Tokyo',
    continent: 'Asia',
    in_geoguessr: true,
    code: 'jp'
  }
];

// Sample test data for bollards
const testBollards: Array<{
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: mongoose.Types.ObjectId[];
}> = [
  {
    imageUrl: 'https://example.com/bollard1.jpg',
    description: 'A typical French bollard',
    googleMapsUrl: 'https://maps.google.com/?q=Paris',
    countries: [] // Will be filled with ObjectIds after countries are inserted
  },
  {
    imageUrl: 'https://example.com/bollard2.jpg',
    description: 'A typical German bollard',
    googleMapsUrl: 'https://maps.google.com/?q=Berlin',
    countries: [] // Will be filled with ObjectIds after countries are inserted
  }
];

// Set up app and database before tests
beforeAll(async () => {
  // Create a new in-memory database for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Configure mongoose to use the in-memory database
  await mongoose.connect(mongoUri);
  
  // Setup express app
  app = express();
  app.use(express.json());
  app.use('/api', routes);
  
  // Insert test countries
  const insertedCountries = await Country.insertMany(testCountries) as Array<mongoose.Document & {
    _id: mongoose.Types.ObjectId;
    name: string;
    capital: string;
    continent: string;
    code: string;
  }>;
  
  // Update bollard test data with actual country ObjectIds
  testBollards[0].countries = [insertedCountries[0]._id]; // French bollard
  testBollards[1].countries = [insertedCountries[1]._id]; // German bollard
  
  // Insert test bollards
  await Bollard.insertMany(testBollards);
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

describe('Bollard Quiz Flow', () => {
  test('Complete quiz flow: get question, answer, and verify result', async () => {
    // Step 1: Get a quiz question
    const questionResponse = await request(app).get('/api/quiz-questions/bollards');
    
    expect(questionResponse.status).toBe(200);
    expect(questionResponse.body).toHaveProperty('sessionId');
    expect(questionResponse.body).toHaveProperty('question');
    
    const { sessionId } = questionResponse.body;
    const question = questionResponse.body.question;
    
    // Verify question structure specific to bollards
    expect(question).toHaveProperty('imageUrl');
    expect(question.question).toBe('In which country can you find this bollard?');
    expect(question.imageUrl).toMatch(/^https:\/\/example\.com\/bollard\d\.jpg$/);
    
    // Find the correct option
    const correctOption = question.options.find((opt: any) => opt.isCorrect);
    expect(correctOption).toBeDefined();
    
    // Step 2: Submit the answer (correct answer)
    const answerResponse = await request(app)
      .post('/api/quiz-answers/bollards')
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
    
    // Check that the quiz type is bollards
    expect(resultResponse.body.result).toHaveProperty('type', 'bollards');
    expect(resultResponse.body.result).toHaveProperty('quizType', 'bollards');
  });
}); 