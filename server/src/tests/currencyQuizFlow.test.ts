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

describe('Currency Quiz Flow', () => {
  test('Complete quiz flow: get question, answer, and verify result', async () => {
    // Step 1: Create a quiz session
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

    // Step 2: Get a quiz question
    const questionResponse = await request(app).get(`/quiz-questions/currencies?sessionId=${sessionId}`);

    expect(questionResponse.status).toBe(200);
    expect(questionResponse.body).toHaveProperty('question');

    const question = questionResponse.body.question;

    // Verify question structure specific to currencies
    expect(question.question).toMatch(/Which country uses the currency .*/);

    // Find the correct option
    const correctOption = question.options.find((opt: any) => opt.isCorrect);
    expect(correctOption).toBeDefined();

    // Step 3: Submit the answer (correct answer)
    const answerResponse = await request(app)
      .post('/quiz-answers/currencies')
      .send({
        sessionId,
        questionId: question.id,
        selectedOptionId: correctOption.id,
        isCorrect: true,
        timeSpentMs: 5000  // 5 seconds
      });

    expect(answerResponse.status).toBe(200);
    expect(answerResponse.body).toHaveProperty('success', true);
    expect(answerResponse.body).toHaveProperty('score', 1);

    // Step 4: Get the quiz result
    const resultResponse = await request(app)
      .get(`/quiz-results/${sessionId}`);

    expect(resultResponse.status).toBe(200);
    expect(resultResponse.body).toHaveProperty('success', true);
    expect(resultResponse.body).toHaveProperty('result');
    expect(resultResponse.body.result).toHaveProperty('quizId', sessionId);
    expect(resultResponse.body.result).toHaveProperty('type', 'currencies');
    expect(resultResponse.body.result).toHaveProperty('score', 1);
    expect(resultResponse.body.result).toHaveProperty('total', 1);
    expect(resultResponse.body.result).toHaveProperty('attempts');
    expect(resultResponse.body.result.attempts.length).toBe(1);
  });

  test('Quiz flow with multiple questions should track previous entity IDs', async () => {
    // Step 1: Initialize a quiz session
    const initResponse = await request(app)
      .post('/quiz-sessions')
      .send({
        type: 'currencies',
        userName: 'Test User'
      });

    expect(initResponse.status).toBe(201);
    expect(initResponse.body).toHaveProperty('success', true);
    expect(initResponse.body).toHaveProperty('quizId');

    const sessionId = initResponse.body.quizId;

    // Step 2: Get the first question
    const question1Response = await request(app)
      .get(`/quiz-questions/currencies?sessionId=${sessionId}`);

    expect(question1Response.status).toBe(200);
    const question1 = question1Response.body.question;

    // Find the correct option for the first question
    const correctOption1 = question1.options.find((opt: any) => opt.isCorrect);

    // Step 3: Submit the answer to the first question
    await request(app)
      .post('/quiz-answers/currencies')
      .send({
        sessionId,
        questionId: question1.id,
        selectedOptionId: correctOption1.id,
        isCorrect: true,
        timeSpentMs: 3000
      });

    // Step 4: Get the second question
    const question2Response = await request(app)
      .get(`/quiz-questions/currencies?sessionId=${sessionId}`);

    expect(question2Response.status).toBe(200);
    const question2 = question2Response.body.question;

    // Verify that the second question is different from the first
    expect(question2.id).not.toBe(question1.id);

    // Find the correct option for the second question
    const correctOption2 = question2.options.find((opt: any) => opt.isCorrect);

    // Step 5: Submit the answer to the second question
    await request(app)
      .post('/quiz-answers/currencies')
      .send({
        sessionId,
        questionId: question2.id,
        selectedOptionId: correctOption2.id,
        isCorrect: true,
        timeSpentMs: 4000
      });

    // Step 6: Get the quiz result
    const resultResponse = await request(app)
      .get(`/quiz-results/${sessionId}`);

    expect(resultResponse.status).toBe(200);
    expect(resultResponse.body.result.attempts.length).toBe(2);

    // Verify that the two attempts have different question IDs
    const questionIds = resultResponse.body.result.attempts.map((a: any) => a.questionId);
    expect(new Set(questionIds).size).toBe(2);
  });
});
