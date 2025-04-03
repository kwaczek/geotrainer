import { ReactNode } from 'react';

export type QuizType = 'flags' | 'capitals' | 'bollards' | 'licenseplates' | 'roadsigns' | 'languages';

export interface QuizFilters {
  continent?: string;
  in_geoguessr?: boolean;
  pedestrian?: boolean;
  [key: string]: any;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  imageUrl?: string;
  options: QuizOption[];
  timeLimit?: number;
  metadata?: {
    allCorrectCountryNames?: string[];
    [key: string]: any;
  };
}

export interface QuestionAttempt {
  questionId: string;
  questionText: string;
  correctOptionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpentMs: number;
  imageUrl?: string;
  selectedCountryName?: string;
  correctCountryName?: string;
  userCustomInput?: string;
}

export interface QuizSession {
  sessionId: string;
  quizType: QuizType;
  score: number;
  questionCount: number;
  attempts: QuestionAttempt[];
  currentQuestion?: QuizQuestion;
  filters?: QuizFilters;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface QuizConfig {
  type: QuizType;
  title: string;
  description: string;
  hasImages: boolean;
  questionTemplate: string;
  timeLimit: number;
  questionsPerQuiz: number;
  dataSource: {
    endpoint: string;
    imageField?: string;
    correctAnswerField: string;
  };
  renderQuestion?: (question: QuizQuestion) => ReactNode;
}

export interface QuizResult {
  quizId: string;
  quizType: QuizType;
  userName: string;
  score: number;
  total: number;
  attempts: QuestionAttempt[];
  createdAt: Date;
  completedAt?: Date;
  filters?: QuizFilters;
} 