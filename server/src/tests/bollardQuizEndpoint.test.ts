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

describe('Bollard Quiz API Endpoint', () => {
  test('GET /api/quiz-questions/bollards should return a valid question', async () => {
    const response = await request(app).get('/api/quiz-questions/bollards');
    
    // Check status code
    expect(response.status).toBe(200);
    
    // Check response structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('question');
    
    // Check question structure
    expect(response.body.question).toHaveProperty('id');
    expect(response.body.question).toHaveProperty('question');
    expect(response.body.question).toHaveProperty('options');
    expect(response.body.question).toHaveProperty('imageUrl');
    expect(response.body.question).toHaveProperty('metadata');
    expect(response.body.question.metadata).toHaveProperty('bollardId');
    expect(response.body.question.metadata).toHaveProperty('allCorrectCountryNames');
    
    // Verify options
    expect(Array.isArray(response.body.question.options)).toBe(true);
    // We only have 3 countries in our test data, so there will be only 3 options
    expect(response.body.question.options.length).toBeGreaterThanOrEqual(2);
    
    // Check that only one option is correct
    const correctOptions = response.body.question.options.filter((opt: any) => opt.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // Verify the question format
    expect(response.body.question.question).toBe('In which country can you find this bollard?');
    
    // Verify that the image URL is formatted correctly
    expect(response.body.question.imageUrl).toMatch(/^https:\/\/example\.com\/bollard\d\.jpg$/);
  });
  
  test('GET /api/quiz-questions/bollards with continent parameter', async () => {
    // Since we're using a real API but with test data, we can't guarantee which
    // continent will be used in the response. Instead, we'll just check that
    // the API accepts the continent parameter and returns a valid question.
    
    const response = await request(app).get('/api/quiz-questions/bollards?filters={"continent":"Europe"}');
    
    // Check status code
    expect(response.status).toBe(200);
    
    // Check basic structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('question');
    expect(response.body.question).toHaveProperty('question');
    expect(response.body.question).toHaveProperty('options');
    expect(response.body.question).toHaveProperty('imageUrl');
    
    // Verify options
    expect(Array.isArray(response.body.question.options)).toBe(true);
    // We only have 3 countries in our test data, so there will be fewer options
    expect(response.body.question.options.length).toBeGreaterThanOrEqual(2);
    
    // Check that only one option is correct
    const correctOptions = response.body.question.options.filter((opt: any) => opt.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // Verify the question format
    expect(response.body.question.question).toBe('In which country can you find this bollard?');
    
    // Check image URL format
    expect(response.body.question.imageUrl).toMatch(/^https:\/\/example\.com\/bollard\d\.jpg$/);
  });
  
  test('POST /api/quiz-answers/bollards should process an answer correctly', async () => {
    // First, get a question to answer
    const questionResponse = await request(app).get('/api/quiz-questions/bollards');
    const { sessionId } = questionResponse.body;
    const question = questionResponse.body.question;
    
    // Find the correct option
    const correctOption = question.options.find((opt: any) => opt.isCorrect);
    
    // Submit the correct answer
    const answerResponse = await request(app)
      .post('/api/quiz-answers/bollards')
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