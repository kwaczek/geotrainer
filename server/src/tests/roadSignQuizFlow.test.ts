/// <reference types="jest" />
import request from 'supertest';
import mongoose from 'mongoose';
// Remove MongoMemoryServer import if no longer needed directly
// import { MongoMemoryServer } from 'mongodb-memory-server'; 
import express from 'express';
// Keep model imports if needed for type definitions, but we won't interact with them directly in setup
import Country from '../models/Country';
import RoadSign from '../models/RoadSign';
import { connectDB } from '../config/db';
import routes from '../routes';

// Mock database connections and models
jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined)
}));
// Add mocks for models if needed by controllers under test (may not be needed for /api/init)
// jest.mock('../models/Country'); 
// jest.mock('../models/RoadSign');

// Remove mongoServer variable
// let mongoServer: MongoMemoryServer; 
let app: express.Application;

// Remove sample data as it won't be seeded here
// const testCountries = [...];
// const testRoadSigns = [...];

// Set up app ONLY before tests
beforeAll(async () => { // Keep async if other async setup might be added later
  // Remove mongoServer creation and connection
  // mongoServer = await MongoMemoryServer.create();
  // const mongoUri = mongoServer.getUri();
  // await mongoose.connect(mongoUri);
  
  // Setup express app
  app = express();
  app.use(express.json());
  app.use('/api', routes);
  
  // Remove data seeding
  // const insertedCountries = await Country.insertMany(testCountries) ...
  // await RoadSign.insertMany(testRoadSigns);
});

// Clean up after all tests are done - remove mongoose/mongoServer specific cleanup
afterAll(async () => { // Keep async if other async teardown might be added later
  // Remove mongoose disconnect and mongoServer stop
  // if (mongoose.connection) {
  //   await mongoose.connection.close();
  // }
  // if (mongoServer) {
  //   await mongoServer.stop();
  // }
});

describe('Road Sign Quiz Flow', () => {
  // Keep the tests, but they might fail now due to lack of seeded data.
  // Focus on the /api/init test first.
  test('Complete quiz flow: get question, answer, and verify result', async () => {
    // ... existing test code ... 
    // This test will likely fail because no data is seeded, but that's expected for now.
  });

  test('should initialize session correctly when type filter is applied', async () => {
    // ... existing test code ... 
    // Focus on whether this specific test still gets a 404.
  });
}); 