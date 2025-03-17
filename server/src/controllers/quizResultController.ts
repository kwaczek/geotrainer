import { Request, Response, NextFunction } from 'express';
import QuizResult, { IQuizResult, QuestionAttempt, QuizType } from '../models/QuizResult';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

interface PopulatedCountry {
  _id: mongoose.Types.ObjectId;
  name: string;
}

interface PopulatedQuestionAttempt extends Omit<QuestionAttempt, 'correctCountryId' | 'selectedCountryId'> {
  correctCountryId: PopulatedCountry;
  selectedCountryId: PopulatedCountry | null;
}

interface PopulatedQuizResult extends Omit<IQuizResult, 'questionAttempts'> {
  questionAttempts: PopulatedQuestionAttempt[];
}

interface QuizAttemptInput {
  questionId: string;
  questionText: string;
  correctCountryId: string;
  selectedCountryId: string | null;
  isCorrect: boolean;
  timeSpentMs: number;
  imageUrl?: string;
}

/**
 * Initialize a new quiz session
 * @route POST /api/quiz-results
 */
export const initQuizSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, quizType, userName, filters, quizId, questionAttempts } = req.body as {
      type?: string;
      quizType?: string;
      userName?: string;
      filters?: Record<string, any>;
      quizId?: string;
      questionAttempts?: QuizAttemptInput[];
    };
    
    // Get the quiz type from either type or quizType field
    const quizTypeValue = type || quizType;
    
    // Validate quiz type
    if (!quizTypeValue || ![QuizType.FLAGS, QuizType.CAPITALS, QuizType.BOLLARDS, QuizType.LICENSEPLATES].includes(quizTypeValue.toLowerCase() as QuizType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid quiz type. Must be either "flags", "capitals", "bollards", or "licenseplates"'
      });
      return;
    }

    // If quizId is provided, try to update existing quiz
    if (quizId) {
      console.log('Updating existing quiz:', quizId);
      const existingQuiz = await QuizResult.findOne({ quizId });
      
      if (existingQuiz) {
        // Update the quiz with new attempts
        if (questionAttempts) {
          existingQuiz.questionAttempts = questionAttempts.map((attempt: QuizAttemptInput) => ({
            questionId: attempt.questionId,
            questionText: attempt.questionText,
            correctCountryId: new mongoose.Types.ObjectId(attempt.correctCountryId),
            selectedCountryId: attempt.selectedCountryId ? new mongoose.Types.ObjectId(attempt.selectedCountryId) : null,
            isCorrect: attempt.isCorrect,
            timeSpentMs: attempt.timeSpentMs,
            imageUrl: attempt.imageUrl
          }));

          // Update score and completion status
          existingQuiz.totalScore = questionAttempts.filter((a: QuizAttemptInput) => a.isCorrect).length;
          existingQuiz.totalQuestions = questionAttempts.length;
          existingQuiz.totalTimeSpentMs = questionAttempts.reduce((total: number, a: QuizAttemptInput) => total + a.timeSpentMs, 0);
          existingQuiz.isCompleted = true;
          existingQuiz.completedAt = new Date();

          await existingQuiz.save();
          console.log('Quiz updated successfully:', quizId);

          res.status(200).json({
            success: true,
            quizId: existingQuiz.quizId,
            message: 'Quiz updated successfully'
          });
          return;
        }
      }
    }
    
    // Create a new quiz result document
    console.log('Creating new quiz with ID:', quizId || uuidv4());
    const quizResult = await QuizResult.create({
      quizId: quizId || uuidv4(),
      userName: userName || 'Anonymous',
      type: quizTypeValue.toLowerCase() as QuizType,
      filters: filters || {},
      questionAttempts: questionAttempts ? questionAttempts.map((attempt: QuizAttemptInput) => ({
        questionId: attempt.questionId,
        questionText: attempt.questionText,
        correctCountryId: new mongoose.Types.ObjectId(attempt.correctCountryId),
        selectedCountryId: attempt.selectedCountryId ? new mongoose.Types.ObjectId(attempt.selectedCountryId) : null,
        isCorrect: attempt.isCorrect,
        timeSpentMs: attempt.timeSpentMs,
        imageUrl: attempt.imageUrl
      })) : [],
      totalScore: questionAttempts ? questionAttempts.filter((a: QuizAttemptInput) => a.isCorrect).length : 0,
      totalQuestions: questionAttempts ? questionAttempts.length : 0,
      totalTimeSpentMs: questionAttempts ? questionAttempts.reduce((total: number, a: QuizAttemptInput) => total + a.timeSpentMs, 0) : 0,
      isCompleted: questionAttempts ? true : false,
      completedAt: questionAttempts ? new Date() : undefined
    });

    await quizResult.save();
    console.log('Quiz created successfully:', quizResult.quizId);

    res.status(201).json({
      success: true,
      quizId: quizResult.quizId,
      message: 'Quiz session initialized successfully'
    });
  } catch (error: any) {
    console.error('Error initializing quiz session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize quiz session',
      error: error.message
    });
  }
};

/**
 * Record an attempt for a quiz question
 * @route POST /api/quiz-results/:quizId/attempts
 */
export const recordQuestionAttempt = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const { questionId, questionText, correctCountryId, selectedCountryId, isCorrect, timeSpentMs, imageUrl } = req.body;

    // Find the quiz result
    const quizResult = await QuizResult.findOne({ quizId });
    if (!quizResult) {
      res.status(404).json({ message: 'Quiz session not found' });
      return;
    }

    // Create the attempt object
    const attempt: QuestionAttempt = {
      questionId,
      questionText,
      correctCountryId: new mongoose.Types.ObjectId(correctCountryId),
      selectedCountryId: selectedCountryId ? new mongoose.Types.ObjectId(selectedCountryId) : null,
      isCorrect,
      timeSpentMs,
      imageUrl
    };

    // Add the attempt to the questionAttempts array
    quizResult.questionAttempts.push(attempt);

    // Update totalScore if the answer was correct
    if (isCorrect) {
      quizResult.totalScore += 1;
    }

    // Update totalQuestions
    quizResult.totalQuestions += 1;

    // Update totalTimeSpentMs
    quizResult.totalTimeSpentMs = (quizResult.totalTimeSpentMs || 0) + timeSpentMs;

    // Save the updated quiz result
    await quizResult.save();

    res.json({ 
      success: true, 
      score: quizResult.totalScore,
      totalAttempts: quizResult.questionAttempts.length 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Complete a quiz session
 * @route POST /api/quiz-results/:quizId/complete
 */
export const completeQuizSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quizId = req.params.quizId;

    // Find the quiz result document
    const quizResult = await QuizResult.findOne({ quizId });
    
    if (!quizResult) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found'
      });
    }

    // Verify that the quiz has question attempts
    if (quizResult.questionAttempts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete quiz with no question attempts'
      });
    }

    // Update quiz completion status
    quizResult.isCompleted = true;
    quizResult.completedAt = new Date();

    await quizResult.save();

    res.status(200).json({
      success: true,
      message: 'Quiz session completed successfully',
      result: {
        quizId: quizResult.quizId,
        type: quizResult.type,
        score: quizResult.totalScore,
        total: quizResult.totalQuestions,
        accuracy: quizResult.totalQuestions > 0 ? quizResult.totalScore / quizResult.totalQuestions : 0
      }
    });
  } catch (error: any) {
    console.error('Error completing quiz session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete quiz session',
      error: error.message
    });
  }
};

/**
 * Get quiz results for analytics
 * @route GET /api/quiz-results/analytics
 */
export const getQuizAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This would be a protected route in production
    // We could add filters, pagination, etc.
    const results = await QuizResult.find()
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error: any) {
    console.error('Error fetching quiz analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz analytics',
      error: error.message
    });
  }
};

/**
 * Get the next question for a quiz
 * @route GET /api/quiz-results/:quizId/next-question
 */
export const getNextQuestion = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    
    // Find the quiz result
    const quizResult = await QuizResult.findOne({ quizId });
    if (!quizResult) {
      res.status(404).json({ message: 'Quiz session not found' });
      return;
    }

    // For now, we support flags, capitals, bollards, and license plates quizzes
    if (quizResult.type !== QuizType.FLAGS && 
        quizResult.type !== QuizType.CAPITALS && 
        quizResult.type !== QuizType.BOLLARDS &&
        quizResult.type !== QuizType.LICENSEPLATES) {
      res.status(400).json({ message: 'Unsupported quiz type' });
      return;
    }
    
    // Return success for now - the actual quiz logic will handle getting the next question
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuizResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quizId = req.params.quizId;
    console.log('Fetching quiz result for ID:', quizId);
    
    const quizResult = await QuizResult.findOne({ quizId })
      .populate<{ questionAttempts: PopulatedQuestionAttempt[] }>('questionAttempts.correctCountryId', 'name')
      .populate<{ questionAttempts: PopulatedQuestionAttempt[] }>('questionAttempts.selectedCountryId', 'name');
    
    console.log('Found quiz result:', quizResult);
    
    if (!quizResult) {
      console.log('Quiz result not found for ID:', quizId);
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }

    // Transform the response data
    const responseData = {
      success: true,
      result: {
        quizId: quizResult.quizId,
        userName: quizResult.userName,
        type: quizResult.type,
        quizType: quizResult.type,
        score: quizResult.totalScore,
        total: quizResult.totalQuestions,
        totalTimeSpentMs: quizResult.totalTimeSpentMs,
        isCompleted: quizResult.isCompleted,
        createdAt: quizResult.createdAt,
        completedAt: quizResult.completedAt,
        attempts: (quizResult as PopulatedQuizResult).questionAttempts.map(attempt => ({
          questionId: attempt.questionId,
          questionText: attempt.questionText,
          correctOptionId: attempt.correctCountryId?._id,
          correctCountryId: attempt.correctCountryId?._id,
          correctCountryName: attempt.correctCountryId?.name,
          selectedOptionId: attempt.selectedCountryId?._id || null,
          selectedCountryId: attempt.selectedCountryId?._id || null,
          selectedCountryName: attempt.selectedCountryId?.name,
          isCorrect: attempt.isCorrect,
          timeSpentMs: attempt.timeSpentMs,
          imageUrl: attempt.imageUrl
        }))
      }
    };

    console.log('Sending response:', responseData);
    res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Error fetching quiz result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz result',
      error: error.message
    });
  }
};
