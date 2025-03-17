import { Request, Response, NextFunction } from 'express';
import QuizResult from '../../models/QuizResult';
import { PopulatedQuestionAttempt } from './types';

/**
 * Get a quiz result by ID
 * @route GET /api/quiz-results/:quizId
 */
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
        score: quizResult.totalScore,
        total: quizResult.totalQuestions,
        totalTimeSpentMs: quizResult.totalTimeSpentMs,
        isCompleted: quizResult.isCompleted,
        createdAt: quizResult.createdAt,
        completedAt: quizResult.completedAt,
        questionAttempts: quizResult.questionAttempts.map(attempt => {
          // Get country names from populated fields
          const correctCountryName = attempt.correctCountryId && typeof attempt.correctCountryId === 'object' 
            ? attempt.correctCountryId.name 
            : undefined;
          
          const selectedCountryName = attempt.selectedCountryId && typeof attempt.selectedCountryId === 'object' 
            ? attempt.selectedCountryId.name 
            : undefined;
          
          return {
            questionId: attempt.questionId,
            questionText: attempt.questionText,
            correctOptionId: attempt.correctCountryId?._id?.toString() || '',
            selectedOptionId: attempt.selectedCountryId?._id?.toString() || null,
            isCorrect: attempt.isCorrect,
            timeSpentMs: attempt.timeSpentMs,
            imageUrl: attempt.imageUrl,
            // Include country names
            correctCountryName,
            selectedCountryName
          };
        })
      }
    };

    return res.json(responseData);
  } catch (error: any) {
    console.error('Error fetching quiz result:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz result',
      error: error.message
    });
  }
}; 