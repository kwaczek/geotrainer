import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Country from '../models/Country';
import routes from '../routes';
import { connectDB } from '../config/db';

let mongoServer: MongoMemoryServer;
let app: express.Application;

// Sample test data
const testCountries = [
  {
    name: 'France',
    capital: 'Paris',
    continent: 'Europe',
    in_geoguessr: true,
    code: 'fr',
    domain: ['fr']
  },
  {
    name: 'Germany',
    capital: 'Berlin',
    continent: 'Europe',
    in_geoguessr: true,
    code: 'de',
    domain: ['de']
  },
  {
    name: 'Japan',
    capital: 'Tokyo',
    continent: 'Asia',
    in_geoguessr: true,
    code: 'jp',
    domain: ['jp']
  },
  {
    name: 'Australia',
    capital: 'Canberra',
    continent: 'Oceania',
    in_geoguessr: true,
    code: 'au',
    domain: ['au']
  },
  {
    name: 'Brazil',
    capital: 'Brasília',
    continent: 'South America',
    in_geoguessr: true,
    code: 'br',
    domain: ['br']
  }
];

beforeAll(async () => {
  // Set up MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri);

  // Set up Express app
  app = express();
  app.use(express.json());
  app.use('/', routes);

  // Insert test data
  await Country.insertMany(testCountries);
});

afterAll(async () => {
  // Clean up
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Domain Quiz API Endpoint', () => {
  test('GET /quiz-questions/domains should return a valid domains question', async () => {
    // First, create a quiz session
    const sessionResponse = await request(app)
      .post('/quiz-sessions')
      .send({
        type: 'domains',
        userName: 'Test User'
      });

    expect(sessionResponse.status).toBe(201);
    expect(sessionResponse.body).toHaveProperty('success', true);
    expect(sessionResponse.body).toHaveProperty('quizId');

    const sessionId = sessionResponse.body.quizId;

    // Now get a question
    const response = await request(app).get(`/quiz-questions/domains?sessionId=${sessionId}`);

    // Check status code
    expect(response.status).toBe(200);

    // Check response structure
    expect(response.body).toHaveProperty('success', true);
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
    expect(response.body.question.question).toMatch(/Which country uses the domain ".*"\?/);

    // Verify metadata
    expect(response.body.question).toHaveProperty('metadata');
    expect(response.body.question.metadata).toHaveProperty('allDomains');
    expect(response.body.question.metadata).toHaveProperty('countryId');
    expect(response.body.question.metadata).toHaveProperty('entityId');
  });

  test('GET /quiz-questions/domains with continent parameter', async () => {
    // First, create a quiz session with filters
    const sessionResponse = await request(app)
      .post('/quiz-sessions')
      .send({
        type: 'domains',
        userName: 'Test User',
        filters: {
          continent: 'Europe'
        }
      });

    expect(sessionResponse.status).toBe(201);
    expect(sessionResponse.body).toHaveProperty('success', true);
    expect(sessionResponse.body).toHaveProperty('quizId');

    const sessionId = sessionResponse.body.quizId;

    // Now get a question
    const response = await request(app).get(`/quiz-questions/domains?sessionId=${sessionId}`);

    // Check status code
    expect(response.status).toBe(200);

    // Check basic structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('question');
    expect(response.body.question).toHaveProperty('question');
    expect(response.body.question).toHaveProperty('options');

    // Verify options
    expect(Array.isArray(response.body.question.options)).toBe(true);
    expect(response.body.question.options.length).toBe(4);

    // Check that only one option is correct
    const correctOptions = response.body.question.options.filter((opt: any) => opt.isCorrect);
    expect(correctOptions.length).toBe(1);

    // Verify the question format
    expect(response.body.question.question).toMatch(/Which country uses the domain ".*"\?/);
  });

  test('GET /quiz-questions/domains with in_geoguessr parameter', async () => {
    // First, create a quiz session with filters
    const sessionResponse = await request(app)
      .post('/quiz-sessions')
      .send({
        type: 'domains',
        userName: 'Test User',
        filters: {
          in_geoguessr: true
        }
      });

    expect(sessionResponse.status).toBe(201);
    expect(sessionResponse.body).toHaveProperty('success', true);
    expect(sessionResponse.body).toHaveProperty('quizId');

    const sessionId = sessionResponse.body.quizId;

    // Now get a question
    const response = await request(app).get(`/quiz-questions/domains?sessionId=${sessionId}`);

    // Check status code
    expect(response.status).toBe(200);

    // Check basic structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('question');

    // Verify the question format
    expect(response.body.question.question).toMatch(/Which country uses the domain ".*"\?/);
  });

  test('POST /quiz-answers/domains should process an answer correctly', async () => {
    // First, create a quiz session
    const sessionResponse = await request(app)
      .post('/quiz-sessions')
      .send({
        type: 'domains',
        userName: 'Test User'
      });

    expect(sessionResponse.status).toBe(201);
    const sessionId = sessionResponse.body.quizId;

    // Get a question to answer
    const questionResponse = await request(app).get(`/quiz-questions/domains?sessionId=${sessionId}`);
    const question = questionResponse.body.question;

    // Find the correct option
    const correctOption = question.options.find((opt: any) => opt.isCorrect);

    // Submit the correct answer
    const answerResponse = await request(app)
      .post('/quiz-answers/domains')
      .send({
        sessionId,
        questionId: question.id,
        selectedOptionId: correctOption.id,
        isCorrect: true,
        timeSpentMs: 3000
      });

    // Check status code
    expect(answerResponse.status).toBe(200);

    // Check response structure
    expect(answerResponse.body).toHaveProperty('success', true);
    expect(answerResponse.body).toHaveProperty('score', 1);
    expect(answerResponse.body).toHaveProperty('questionCount', 1);
  });

  test('GET /countries/count with has_domain parameter should return the correct count', async () => {
    const response = await request(app).get('/countries/count?has_domain=true');

    // Check status code
    expect(response.status).toBe(200);

    // Check response structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('count');

    // Check that the count is correct (should be 5 based on our test data)
    expect(response.body.count).toBe(5);
  });
});
