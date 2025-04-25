import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import routes from '../routes';
import Country from '../models/Country';

let app: express.Application;
let mongoServer: MongoMemoryServer;

// Sample test data
const testCountries = [
  {
    name: 'France',
    capital: 'Paris',
    continent: 'Europe',
    in_geoguessr: true,
    code: 'fr',
    currency: [{ name: 'Euro', symbol: '€', code: 'EUR' }]
  },
  {
    name: 'Germany',
    capital: 'Berlin',
    continent: 'Europe',
    in_geoguessr: true,
    code: 'de',
    currency: [{ name: 'Euro', symbol: '€', code: 'EUR' }]
  },
  {
    name: 'Japan',
    capital: 'Tokyo',
    continent: 'Asia',
    in_geoguessr: true,
    code: 'jp',
    currency: [{ name: 'Japanese Yen', symbol: '¥', code: 'JPY' }]
  },
  {
    name: 'United Kingdom',
    capital: 'London',
    continent: 'Europe',
    in_geoguessr: true,
    code: 'gb',
    currency: [{ name: 'Pound Sterling', symbol: '£', code: 'GBP' }]
  },
  {
    name: 'United States',
    capital: 'Washington, D.C.',
    continent: 'North America',
    in_geoguessr: true,
    code: 'us',
    currency: [{ name: 'US Dollar', symbol: '$', code: 'USD' }]
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

describe('Currency Quiz API Endpoint', () => {
  test('GET /quiz-questions/currencies should return a valid currencies question', async () => {
    // First, create a quiz session
    const sessionResponse = await request(app)
      .post('/quiz-sessions')
      .send({
        type: 'currencies',
        userName: 'Test User'
      });

    expect(sessionResponse.status).toBe(201);
    expect(sessionResponse.body).toHaveProperty('success', true);
    expect(sessionResponse.body).toHaveProperty('quizId');

    const sessionId = sessionResponse.body.quizId;

    // Now get a question
    const response = await request(app).get(`/quiz-questions/currencies?sessionId=${sessionId}`);

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
    expect(response.body.question.question).toMatch(/Which country uses the currency .*/);

    // Verify metadata
    expect(response.body.question).toHaveProperty('metadata');
    expect(response.body.question.metadata).toHaveProperty('allCurrencies');
    expect(response.body.question.metadata).toHaveProperty('countryId');
    expect(response.body.question.metadata).toHaveProperty('entityId');
  });

  test('GET /quiz-questions/currencies with continent parameter', async () => {
    // First, create a quiz session with filters
    const sessionResponse = await request(app)
      .post('/quiz-sessions')
      .send({
        type: 'currencies',
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
    const response = await request(app).get(`/quiz-questions/currencies?sessionId=${sessionId}`);

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
    expect(response.body.question.question).toMatch(/Which country uses the currency .*/);
  });

  test('GET /quiz-questions/currencies with in_geoguessr parameter', async () => {
    // First, create a quiz session with filters
    const sessionResponse = await request(app)
      .post('/quiz-sessions')
      .send({
        type: 'currencies',
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
    const response = await request(app).get(`/quiz-questions/currencies?sessionId=${sessionId}`);

    // Check status code
    expect(response.status).toBe(200);

    // Check basic structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('question');

    // Verify the question format
    expect(response.body.question.question).toMatch(/Which country uses the currency .*/);
  });

  test('POST /quiz-answers/currencies should correctly process an answer', async () => {
    // First, create a quiz session
    const sessionResponse = await request(app)
      .post('/quiz-sessions')
      .send({
        type: 'currencies',
        userName: 'Test User'
      });

    expect(sessionResponse.status).toBe(201);
    const sessionId = sessionResponse.body.quizId;

    // Get a question to answer
    const questionResponse = await request(app).get(`/quiz-questions/currencies?sessionId=${sessionId}`);
    const question = questionResponse.body.question;

    // Find the correct option
    const correctOption = question.options.find((opt: any) => opt.isCorrect);

    // Submit the correct answer
    const answerResponse = await request(app)
      .post('/quiz-answers/currencies')
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

  test('GET /countries/count with has_currency parameter should return the correct count', async () => {
    const response = await request(app).get('/countries/count?has_currency=true');

    // Check status code
    expect(response.status).toBe(200);

    // Check response structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('count');

    // Check that the count is correct (should be 5 based on our test data)
    expect(response.body.count).toBe(5);
  });
});
