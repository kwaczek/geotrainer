import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { 
  initQuizSession, 
  recordQuestionAttempt, 
  completeQuizSession, 
  getQuizResult 
} from '../controllers/quizResultController';
import QuizResult, { QuizType } from '../models/QuizResult';
import Country from '../models/Country';

// Mock the mongoose models first, without referencing uninitialized variables
jest.mock('../models/QuizResult', () => {
  return {
    __esModule: true,
    default: {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn()
    },
    // Add the QuizType enum values that the controller needs
    QuizType: {
      FLAGS: 'flags',
      CAPITALS: 'capitals',
      BOLLARDS: 'bollards',
      LICENSEPLATES: 'licenseplates'
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

// Create mock functions and assign them to the model mocks
const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockCreate = jest.fn();
const mockSave = jest.fn().mockResolvedValue(true);

// Get the mocked imports to use the actual mock functions
QuizResult.findOne = mockFindOne;
QuizResult.find = mockFind;
QuizResult.create = mockCreate;

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
      save: mockSave
    };
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('initQuizSession', () => {
    it('should create a new quiz session', async () => {
      // Setup
      req.body = {
        quizType: 'flags',
        userName: 'TestUser'
      };
      
      // Mock create to return our mock instance
      mockCreate.mockResolvedValue(mockQuizResultInstance);
      
      // Execute
      await initQuizSession(req as Request, res as Response, next);
      
      // Assert
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        quizId: 'test-quiz-id',
        userName: 'TestUser',
        type: 'flags'
      }));
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        quizId: 'test-quiz-id',
        message: 'Quiz session initialized successfully'
      });
    });
    
    it('should handle errors', async () => {
      // Setup
      req.body = {
        quizType: 'flags',
        userName: 'TestUser'
      };
      const mockError = new Error('Test error');
      mockCreate.mockRejectedValue(mockError);
      
      // Execute
      await initQuizSession(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to initialize quiz session',
        error: 'Test error'
      });
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
      
      mockFindOne.mockResolvedValue(mockQuizResultInstance);
      
      // Execute
      await recordQuestionAttempt(req as Request, res as Response);
      
      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ quizId: 'test-quiz-id' });
      expect(mockQuizResultInstance.questionAttempts.push).toHaveBeenCalled();
      expect(mockQuizResultInstance.totalQuestions).toBe(1);
      expect(mockQuizResultInstance.totalScore).toBe(1);
      expect(mockQuizResultInstance.totalTimeSpentMs).toBe(5000);
      expect(mockSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
    
    it('should handle quiz not found', async () => {
      // Setup
      req.params = { quizId: 'non-existent-id' };
      mockFindOne.mockResolvedValue(null);
      
      // Execute
      await recordQuestionAttempt(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz session not found'
      });
    });
    
    it('should handle errors', async () => {
      // Setup
      req.params = { quizId: 'test-quiz-id' };
      const mockError = new Error('Test error');
      mockFindOne.mockRejectedValue(mockError);
      
      // Execute
      await recordQuestionAttempt(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Test error'
      });
    });
  });
  
  describe('completeQuizSession', () => {
    it('should complete a quiz session', async () => {
      // Setup
      req.params = { quizId: 'test-quiz-id' };
      
      mockQuizResultInstance.type = 'flags';
      mockQuizResultInstance.totalScore = 8;
      mockQuizResultInstance.totalQuestions = 10;
      mockQuizResultInstance.isCompleted = false;
      mockQuizResultInstance.completedAt = null;
      mockQuizResultInstance.questionAttempts = [{}]; // Add a mock attempt
      
      mockFindOne.mockResolvedValue(mockQuizResultInstance);
      
      // Execute
      await completeQuizSession(req as Request, res as Response, next);
      
      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ quizId: 'test-quiz-id' });
      expect(mockQuizResultInstance.isCompleted).toBe(true);
      expect(mockQuizResultInstance.completedAt).toBeInstanceOf(Date);
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Quiz session completed successfully'
      }));
    });
  });
  
  describe('getQuizResult', () => {
    it('should get a quiz result with populated country references', async () => {
      // Setup
      req.params = { quizId: 'test-quiz-id' };
      
      const mockPopulate = jest.fn().mockReturnThis();
      const mockPopulateFn = jest.fn().mockResolvedValue({
        quizId: 'test-quiz-id',
        type: 'flags',
        questionAttempts: [
          {
            questionText: 'What country is this flag from?',
            correctCountryId: { _id: 'germanId', name: 'Germany' },
            selectedCountryId: { _id: 'germanId', name: 'Germany' },
            isCorrect: true,
            timeSpentMs: 5000
          }
        ]
      });
      
      mockFindOne.mockReturnValue({
        populate: mockPopulate
      });
      
      mockPopulate.mockReturnValue({
        populate: mockPopulateFn
      });
      
      // Execute
      await getQuizResult(req as Request, res as Response, next);
      
      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ quizId: 'test-quiz-id' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });
});
