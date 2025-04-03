import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { QuizType } from '../../models/QuizResult';

// Interface for quiz filters
export interface QuizFilters {
  continent?: string;
  in_geoguessr?: boolean;
  pedestrian?: boolean;
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

// Interface for quiz options
export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  imageUrl?: string; // Optional image for options (e.g., flags)
}

// Generic question result interface
export interface QuizQuestion {
  id: string;
  question: string;
  imageUrl?: string;
  description?: string; // Add optional description field for language quizzes
  options: QuizOption[]; // Use QuizOption interface
  metadata?: any;
} 