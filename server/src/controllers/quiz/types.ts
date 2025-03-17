import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { QuizType } from '../../models/QuizResult';

// Interface for quiz filters
export interface QuizFilters {
  continent?: string;
  in_geoguessr?: boolean;
  [key: string]: any;
}

// Interface for quiz session
export interface QuizSession {
  sessionId: string;
  quizType: QuizType;
  score: number;
  questionCount: number;
  attempts: any[];
  lastUpdated: Date;
  filters?: QuizFilters;
  currentQuestion?: {
    id: string;
    question: string;
    imageUrl?: string;
    options: any[];
  };
}

// Define the PopulatedQuestionAttempt interface
export interface PopulatedCountry {
  _id: mongoose.Types.ObjectId;
  name: string;
}

export interface PopulatedQuestionAttempt {
  questionId: string;
  questionText: string;
  correctCountryId: PopulatedCountry;
  selectedCountryId: PopulatedCountry | null;
  isCorrect: boolean;
  timeSpentMs: number;
  imageUrl?: string;
}

// Generic question result interface
export interface QuizQuestion {
  id: string;
  question: string;
  imageUrl?: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  metadata?: any;
} 