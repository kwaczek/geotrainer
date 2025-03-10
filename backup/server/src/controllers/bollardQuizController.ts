import { Request, Response, RequestHandler } from 'express';
import Bollard from '../models/Bollard';
import Country from '../models/Country';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface QuizFilters {
  continent?: string;
  in_geoguessr?: boolean;
}

// Add interface for session storage
interface QuizSession {
  sessionId: string;
  score: number;
  questionCount: number;
  attempts: any[];
  lastUpdated: Date;
  filters?: QuizFilters;
  currentQuestion?: {
    id: string;
    question: string;
    imageUrl: string;
    options: any[];
  };
}

// In-memory session storage (in production, this should be in Redis or a database)
const sessions = new Map<string, QuizSession>();

export const getSession: RequestHandler = async (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    res.status(400).json({ error: 'Session ID is required' });
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.json({
    success: true,
    score: session.score,
    questionCount: session.questionCount,
    attempts: session.attempts,
    currentQuestion: session.currentQuestion
  });
};

export const getQuestion: RequestHandler = async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string || uuidv4();
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) as QuizFilters : undefined;
    
    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        score: 0,
        questionCount: 0,
        attempts: [],
        lastUpdated: new Date(),
        filters
      };
      sessions.set(sessionId, session);
    }

    // If session has a current question and it hasn't been answered yet, return it
    const lastAttempt = session.attempts[session.attempts.length - 1];
    if (session.currentQuestion && (!lastAttempt || lastAttempt.questionId !== session.currentQuestion.id)) {
      res.json({
        question: session.currentQuestion,
        session: { sessionId }
      });
      return;
    }

    // Build the aggregation pipeline based on filters
    const pipeline: any[] = [];

    // Add continent filter if specified
    if (session.filters?.continent && session.filters.continent !== 'all') {
      pipeline.push({
        $lookup: {
          from: 'countries',
          localField: 'countries',
          foreignField: '_id',
          as: 'countryDetails'
        }
      });
      pipeline.push({
        $match: {
          'countryDetails.continent': session.filters.continent
        }
      });
    }

    // Add GeoGuessr filter if specified
    if (session.filters?.in_geoguessr) {
      if (!pipeline.length) {
        pipeline.push({
          $lookup: {
            from: 'countries',
            localField: 'countries',
            foreignField: '_id',
            as: 'countryDetails'
          }
        });
      }
      pipeline.push({
        $match: {
          'countryDetails.in_geoguessr': true
        }
      });
    }

    // Add random sampling
    pipeline.push({ $sample: { size: 1 } });

    // Add country details lookup if not already added
    if (!pipeline.find(stage => stage.$lookup?.as === 'countryDetails')) {
      pipeline.push({
        $lookup: {
          from: 'countries',
          localField: 'countries',
          foreignField: '_id',
          as: 'countryDetails'
        }
      });
    }

    // Get a random bollard with filters
    const bollards = await Bollard.aggregate(pipeline);

    if (!bollards.length) {
      res.status(404).json({ error: 'No bollards found matching the filters' });
      return;
    }

    const bollard = bollards[0];

    // Validate that we have country details
    if (!bollard.countryDetails?.length) {
      res.status(404).json({ error: 'No country details found for this bollard' });
      return;
    }

    // Build wrong countries pipeline
    const wrongCountriesPipeline: any[] = [
      {
        $match: {
          _id: { $nin: bollard.countries }
        }
      }
    ];

    // Apply filters to wrong countries as well
    if (session.filters?.continent && session.filters.continent !== 'all') {
      wrongCountriesPipeline[0].$match.continent = session.filters.continent;
    }
    if (session.filters?.in_geoguessr) {
      wrongCountriesPipeline[0].$match.in_geoguessr = true;
    }

    wrongCountriesPipeline.push({ $sample: { size: 3 } });

    // Get 3 random wrong countries
    const wrongCountries = await Country.aggregate(wrongCountriesPipeline);

    if (!wrongCountries.length) {
      res.status(404).json({ error: 'Not enough countries matching the filters for quiz options' });
      return;
    }

    // Create options array with correct and wrong answers
    const correctCountry = bollard.countryDetails[0];
    const options = [
      {
        id: correctCountry._id.toString(),
        text: correctCountry.name,
        isCorrect: true
      },
      ...wrongCountries.map(country => ({
        id: country._id.toString(),
        text: country.name,
        isCorrect: false
      }))
    ];

    // Shuffle options
    const shuffledOptions = options.sort(() => Math.random() - 0.5);

    const question = {
      id: bollard._id.toString(),
      question: "In which country can you find this bollard?",
      imageUrl: bollard.imageUrl,
      options: shuffledOptions
    };

    // Store the current question in the session
    session.currentQuestion = question;
    session.lastUpdated = new Date();

    res.json({
      question,
      session: { sessionId }
    });
  } catch (error) {
    console.error('Error getting bollard question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitAnswer: RequestHandler = async (req, res) => {
  try {
    const { sessionId, questionId, selectedOptionId, timeSpentMs, isCorrect } = req.body;

    // Update session data
    const session = sessions.get(sessionId);
    if (session) {
      session.questionCount += 1;
      if (isCorrect) {
        session.score += 1;
      }

      // Include the current question data in the attempt
      const attempt = {
        questionId,
        selectedOptionId,
        timeSpentMs,
        isCorrect,
        question: session.currentQuestion?.question || "In which country can you find this bollard?",
        imageUrl: session.currentQuestion?.imageUrl
      };

      session.attempts.push(attempt);
      session.lastUpdated = new Date();
      
      // Clear the current question after it's been answered
      if (session.currentQuestion && session.currentQuestion.id === questionId) {
        session.currentQuestion = undefined;
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 