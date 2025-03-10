import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { 
  initQuizSession, 
  recordQuestionAttempt, 
  completeQuizSession, 
  getQuizResult 
} from '../controllers/quizResultController';
import QuizResult from '../models/QuizResult';
import Country from '../models/Country';

// Mock the mongoose models
jest.mock('../models/QuizResult', () => {
  return {
    __esModule: true,
    default: {
      findOne: jest.fn(),
      find: jest.fn()
    }
  };
});

jest.mock('../models/Country', () => {
  return {
    __esModule: true,
    default: {
      findOne: jest.fn()
    }
  };
});

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-quiz-id')
}));

// Mock mongoose.Types.ObjectId
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id)
    }
  };
});

describe('Quiz Result Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockQuizResultInstance: any;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Setup mock quiz result instance
    mockQuizResultInstance = {
      quizId: 'test-quiz-id',
      questionAttempts: [],
      totalQuestions: 0,
      totalScore: 0,
      totalTimeSpentMs: 0,
      save: jest.fn().mockResolvedValue(true)
    };
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('initQuizSession', () => {
    it('should create a new quiz session', async () => {
      // Setup
      req.body = {
        quizType: 'flags',
        userName: 'TestUser'
      };
      
      // Mock the QuizResult constructor
      const originalQuizResult = QuizResult;
      (QuizResult as any) = jest.fn().mockImplementation(() => mockQuizResultInstance);
      
      // Execute
      await initQuizSession(req as Request, res as Response, next);
      
      // Assert
      expect(QuizResult).toHaveBeenCalledWith({
        quizId: 'test-quiz-id',
        userName: 'TestUser',
        quizType: 'flags'
      });
      expect(mockQuizResultInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        quizId: 'test-quiz-id',
        message: 'Quiz session initialized successfully'
      });
      
      // Restore the original QuizResult
      (QuizResult as any) = originalQuizResult;
    });
    
    it('should handle errors', async () => {
      // Setup
      const mockError = new Error('Test error');
      const originalQuizResult = QuizResult;
      mockQuizResultInstance.save = jest.fn().mockRejectedValue(mockError);
      (QuizResult as any) = jest.fn().mockImplementation(() => mockQuizResultInstance);
      
      // Execute
      await initQuizSession(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to initialize quiz session',
        error: 'Test error'
      });
      
      // Restore the original QuizResult
      (QuizResult as any) = originalQuizResult;
    });
  });
  
  describe('recordQuestionAttempt', () => {
    it('should record a question attempt', async () => {
      // Setup
      req.params = { quizId: 'test-quiz-id' };
      req.body = {
        questionText: 'What country is this flag from?',
        correctCountryId: '60d21b4667d0d8992e610c85',
        selectedCountryId: '60d21b4667d0d8992e610c86',
        isCorrect: true,
        timeSpentMs: 5000
      };
      
      mockQuizResultInstance.questionAttempts.push = jest.fn();
      
      (QuizResult.findOne as jest.Mock).mockResolvedValue(mockQuizResultInstance);
      
      // Execute
      await recordQuestionAttempt(req as Request, res as Response, next);
      
      // Assert
      expect(QuizResult.findOne).toHaveBeenCalledWith({ quizId: 'test-quiz-id' });
      expect(mockQuizResultInstance.questionAttempts.push).toHaveBeenCalled();
      expect(mockQuizResultInstance.totalQuestions).toBe(1);
      expect(mockQuizResultInstance.totalScore).toBe(1);
      expect(mockQuizResultInstance.totalTimeSpentMs).toBe(5000);
      expect(mockQuizResultInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Question attempt recorded successfully'
      });
    });
    
    it('should handle quiz not found', async () => {
      // Setup
      req.params = { quizId: 'non-existent-id' };
      (QuizResult.findOne as jest.Mock).mockResolvedValue(null);
      
      // Execute
      await recordQuestionAttempt(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Quiz session not found'
      });
    });
    
    it('should handle errors', async () => {
      // Setup
      req.params = { quizId: 'test-quiz-id' };
      const mockError = new Error('Test error');
      (QuizResult.findOne as jest.Mock).mockRejectedValue(mockError);
      
      // Execute
      await recordQuestionAttempt(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to record question attempt',
        error: 'Test error'
      });
    });
  });
  
  describe('completeQuizSession', () => {
    it('should complete a quiz session', async () => {
      // Setup
      req.params = { quizId: 'test-quiz-id' };
      
      mockQuizResultInstance.quizType = 'flags';
      mockQuizResultInstance.totalScore = 8;
      mockQuizResultInstance.totalQuestions = 10;
      mockQuizResultInstance.isCompleted = false;
      mockQuizResultInstance.completedAt = null;
      
      (QuizResult.findOne as jest.Mock).mockResolvedValue(mockQuizResultInstance);
      
      // Execute
      await completeQuizSession(req as Request, res as Response, next);
      
      // Assert
      expect(QuizResult.findOne).toHaveBeenCalledWith({ quizId: 'test-quiz-id' });
      expect(mockQuizResultInstance.isCompleted).toBe(true);
      expect(mockQuizResultInstance.completedAt).toBeInstanceOf(Date);
      expect(mockQuizResultInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Quiz session completed successfully',
        result: {
          quizId: 'test-quiz-id',
          quizType: 'flags',
          totalScore: 8,
          totalQuestions: 10,
          accuracy: 0.8
        }
      });
    });
  });
  
  describe('getQuizResult', () => {
    it('should get a quiz result with populated country references', async () => {
      // Setup
      req.params = { quizId: 'test-quiz-id' };
      
      const mockPopulatedQuizResult = {
        quizId: 'test-quiz-id',
        questionAttempts: [
          {
            questionText: 'What country is this flag from?',
            correctCountryId: { name: 'Germany', capital: 'Berlin' },
            selectedCountryId: { name: 'Germany', capital: 'Berlin' },
            isCorrect: true,
            timeSpentMs: 5000
          }
        ]
      };
      
      const mockPopulate = jest.fn().mockReturnThis();
      (QuizResult.findOne as jest.Mock).mockReturnValue({
        populate: mockPopulate
      });
      
      mockPopulate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPopulatedQuizResult)
      });
      
      // Execute
      await getQuizResult(req as Request, res as Response, next);
      
      // Assert
      expect(QuizResult.findOne).toHaveBeenCalledWith({ quizId: 'test-quiz-id' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPopulatedQuizResult
      });
    });
  });
});
