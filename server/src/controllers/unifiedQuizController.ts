/**
 * This file is a unified entry point that re-exports all quiz controller functionality.
 * The implementation has been refactored into multiple files in the ./quiz directory
 * for better maintainability and separation of concerns.
 */

// Import all named exports from the quiz module
import * as quizModule from './quiz';

// Re-export each function directly as named exports (not as properties of an object)
export const initQuizSession = quizModule.initQuizSession;
export const getQuizSession = quizModule.getQuizSession;
export const completeQuizSession = quizModule.completeQuizSession;
export const getNextQuestion = quizModule.getNextQuestion;
export const submitAnswer = quizModule.submitAnswer;
export const getQuizResult = quizModule.getQuizResult;
export const sessions = quizModule.sessions; 