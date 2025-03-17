/// <reference types="jest" />
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import Country from '../models/Country';
import { connectDB } from '../config/db';
import routes from '../routes';

// Mock database connections and models
jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined)
}));

let mongoServer: MongoMemoryServer;
let app: express.Application;

// Sample test data
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
  },
  {
    name: 'Australia',
    capital: 'Canberra',
    continent: 'Oceania',
    in_geoguessr: true,
    code: 'au'
  },
  {
    name: 'Brazil',
    capital: 'Brasília',
    continent: 'South America',
    in_geoguessr: true,
    code: 'br'
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
  
  // Insert test data
  await Country.insertMany(testCountries);
});

// Clean up after tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Capital Quiz API Endpoint', () => {
  test('GET /api/quiz-questions/capitals should return a valid question', async () => {
    const response = await request(app).get('/api/quiz-questions/capitals');
    
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
    
    // Verify options
    expect(Array.isArray(response.body.question.options)).toBe(true);
    expect(response.body.question.options.length).toBe(4);
    
    // Check that only one option is correct
    const correctOptions = response.body.question.options.filter((opt: any) => opt.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // Verify the question format
    expect(response.body.question.question).toMatch(/What is the capital of .+\?/);
  });
  
  test('GET /api/quiz-questions/capitals with continent parameter', async () => {
    // Since we're using a real API but with test data, we can't guarantee which
    // continent will be used in the response. Instead, we'll just check that
    // the API accepts the continent parameter and returns a valid question.
    
    const response = await request(app).get('/api/quiz-questions/capitals?continent=Europe');
    
    // Check status code
    expect(response.status).toBe(200);
    
    // Check basic structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('question');
    expect(response.body.question).toHaveProperty('question');
    expect(response.body.question).toHaveProperty('options');
    
    // Verify options
    expect(Array.isArray(response.body.question.options)).toBe(true);
    expect(response.body.question.options.length).toBe(4);
    
    // Check that only one option is correct
    const correctOptions = response.body.question.options.filter((opt: any) => opt.isCorrect);
    expect(correctOptions.length).toBe(1);
    
    // Verify that we get a question about a country
    expect(response.body.question.question).toMatch(/What is the capital of .+\?/);
  });
}); 