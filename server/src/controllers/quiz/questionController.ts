import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import QuizResult, { QuizType } from '../../models/QuizResult';
import { QuizSession, QuizFilters } from './types';
import { sessions } from './sessionController';
import {
  getRandomFlagQuestion,
  getRandomCapitalQuestion,
  getRandomBollardQuestion,
  getRandomLicensePlateQuestion,
  getRandomRoadSignQuestion,
  getRandomLanguageQuestion,
  getRandomGoogleCarQuestion,
  getRandomPoleQuestion,
  getRandomDomainQuestion,
  getRandomCurrencyQuestion,
  getRandomPhonePrefixQuestion
} from './generators';

/**
 * Get the next question for a quiz
 * @route GET /api/quiz-questions/:quizType
 */
export const getNextQuestion = async (req: Request, res: Response) => {
  try {
    const { quizType } = req.params;
    const sessionId = req.query.sessionId as string || uuidv4();

    // Extract filters from query parameters
    let filters: QuizFilters | undefined;

    // First check if filters are explicitly provided as JSON
    if (req.query.filters) {
      filters = JSON.parse(req.query.filters as string) as QuizFilters;
    }
    // Otherwise, extract individual filter parameters from query
    else {
      const continent = req.query.continent as string;
      const in_geoguessr = req.query.in_geoguessr === 'true';
      const pedestrian = req.query.pedestrian === 'true';

      // Only create filters object if at least one filter is present
      if (continent || in_geoguessr || pedestrian) {
        filters = {};

        if (continent && continent !== 'all') {
          filters.continent = continent;
        }

        if (in_geoguessr) {
          filters.in_geoguessr = in_geoguessr;
        }

        if (pedestrian) {
          filters.pedestrian = pedestrian;
        }
      }
    }

    const previousQuestionIds = req.query.previousQuestionIds
      ? JSON.parse(req.query.previousQuestionIds as string) as string[]
      : [];
    const previousEntityIds = req.query.previousEntityIds
      ? JSON.parse(req.query.previousEntityIds as string) as string[]
      : [];

    console.log(`Getting next question for ${quizType} quiz, sessionId: ${sessionId}, filters:`, filters);
    console.log(`Excluding previous question IDs (${previousQuestionIds.length}):`, previousQuestionIds);
    console.log(`Excluding previous entity IDs (${previousEntityIds.length}):`, previousEntityIds);

    // Validate quiz type
    if (!quizType || ![QuizType.FLAGS, QuizType.CAPITALS, QuizType.BOLLARDS, QuizType.LICENSEPLATES, QuizType.ROADSIGNS, QuizType.LANGUAGES, QuizType.CARS, QuizType.POLES, QuizType.DOMAINS, QuizType.CURRENCIES, QuizType.PHONE_PREFIXES].includes(quizType.toLowerCase() as QuizType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz type. Must be flags, capitals, bollards, licenseplates, roadsigns, languages, cars, poles, domains, currencies, or phoneprefixes'
      });
    }

    // Get or create session
    let session = sessions.get(sessionId);

    if (!session) {
      console.log(`Session ${sessionId} not found, checking database...`);
      // Check if there's a quiz result in the database
      const existingQuiz = await QuizResult.findOne({ quizId: sessionId });

      if (existingQuiz) {
        console.log(`Found existing quiz in database, creating session...`);
        session = {
          sessionId,
          quizType: existingQuiz.type,
          score: existingQuiz.totalScore || 0,
          questionCount: existingQuiz.totalQuestions || 0,
          attempts: existingQuiz.questionAttempts || [],
          lastUpdated: new Date(),
          filters: existingQuiz.filters
        };
      } else {
        console.log(`Creating new session with ID: ${sessionId}`);
        // Create a new session
        session = {
          sessionId,
          quizType: quizType.toLowerCase() as QuizType,
          score: 0,
          questionCount: 0,
          attempts: [],
          lastUpdated: new Date(),
          filters
        };

        // Also create a database record if it doesn't exist
        await QuizResult.create({
          quizId: sessionId,
          userName: 'Anonymous',
          type: quizType.toLowerCase() as QuizType,
          filters: filters || {}
        });

        console.log(`Created new quiz result in database with ID: ${sessionId}`);
      }

      sessions.set(sessionId, session);
    }

    // If session has a current question and it hasn't been answered yet, return it
    if (session.currentQuestion && session.attempts.length === session.questionCount) {
      console.log(`Returning existing question from session: ${session.currentQuestion.id}`);
      return res.json({
        success: true,
        question: session.currentQuestion,
        sessionId: session.sessionId
      });
    }

    // Otherwise, get a new question based on the quiz type
    let question;

    try {
      switch (quizType.toLowerCase()) {
        case QuizType.FLAGS:
          question = await getRandomFlagQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.CAPITALS:
          question = await getRandomCapitalQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.BOLLARDS:
          question = await getRandomBollardQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.LICENSEPLATES:
          question = await getRandomLicensePlateQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.ROADSIGNS:
          question = await getRandomRoadSignQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.LANGUAGES:
          question = await getRandomLanguageQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.CARS:
          question = await getRandomGoogleCarQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.POLES:
          question = await getRandomPoleQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.DOMAINS:
          question = await getRandomDomainQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.CURRENCIES:
          question = await getRandomCurrencyQuestion(session.filters, previousEntityIds);
          break;
        case QuizType.PHONE_PREFIXES:
          question = await getRandomPhonePrefixQuestion(session.filters, previousEntityIds);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid quiz type'
          });
      }

      console.log(`Generated new question: ${question.id}`);
    } catch (error: any) {
      console.error(`Error generating question for ${quizType}:`, error);
      return res.status(500).json({
        success: false,
        message: `Failed to generate ${quizType} question`,
        error: error.message
      });
    }

    // Update the session with the new question
    session.currentQuestion = question;
    session.lastUpdated = new Date();
    sessions.set(sessionId, session);

    return res.json({
      success: true,
      question,
      sessionId
    });
  } catch (error: any) {
    console.error('Error getting next question:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get next question',
      error: error.message
    });
  }
};