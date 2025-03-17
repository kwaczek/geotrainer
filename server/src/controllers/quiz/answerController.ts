import { Request, Response } from 'express';
import mongoose from 'mongoose';
import QuizResult from '../../models/QuizResult';
import { sessions } from './sessionController';

/**
 * Submit an answer for a quiz question
 * @route POST /api/quiz-answers/:quizType
 */
export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const { quizType } = req.params;
    const { sessionId, questionId, selectedOptionId, isCorrect, timeSpentMs, userCustomInput } = req.body;
    
    console.log('Received answer submission:', {
      quizType,
      sessionId,
      questionId,
      selectedOptionId,
      isCorrect,
      timeSpentMs,
      userCustomInput
    });
    
    // Validate required fields
    if (!sessionId || !questionId || !selectedOptionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, question ID, and selected option ID are required'
      });
    }
    
    // Get the session
    let session = sessions.get(sessionId);
    
    // If session not found, try to create it from the database
    if (!session) {
      console.log(`Session ${sessionId} not found in memory, checking database...`);
      const quizResult = await QuizResult.findOne({ quizId: sessionId });
      
      if (quizResult) {
        console.log(`Found quiz result in database, creating session...`);
        session = {
          sessionId,
          quizType: quizResult.type,
          score: quizResult.totalScore || 0,
          questionCount: quizResult.totalQuestions || 0,
          attempts: quizResult.questionAttempts || [],
          lastUpdated: new Date(),
          filters: quizResult.filters
        };
        sessions.set(sessionId, session);
      } else {
        console.log(`No quiz result found in database for session ${sessionId}`);
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
    }
    
    // Get the current question or create a placeholder if not available
    let currentQuestion = session.currentQuestion;
    
    if (!currentQuestion) {
      console.log('No current question in session, creating placeholder...');
      // Create a placeholder question object
      currentQuestion = {
        id: questionId,
        question: 'Unknown question',
        options: []
      };
    }
    
    // Create an attempt object to store in the session
    const attempt = {
      questionId,
      correctOptionId: selectedOptionId,
      selectedOptionId,
      isCorrect,
      timeSpentMs,
      userCustomInput
    };
    
    // Update the session
    session.attempts.push(attempt);
    session.questionCount++;
    
    if (isCorrect) {
      session.score++;
    }
    
    session.lastUpdated = new Date();
    session.currentQuestion = undefined; // Clear the current question
    
    // Save the updated session
    sessions.set(sessionId, session);
    
    // Also update the database record
    try {
      const quizResult = await QuizResult.findOne({ quizId: sessionId });
      
      if (quizResult) {
        // Add the attempt to the questionAttempts array
        quizResult.questionAttempts.push({
          questionId,
          questionText: currentQuestion.question,
          correctCountryId: new mongoose.Types.ObjectId(attempt.correctOptionId),
          selectedCountryId: selectedOptionId ? new mongoose.Types.ObjectId(selectedOptionId) : null,
          isCorrect,
          timeSpentMs,
          imageUrl: currentQuestion.imageUrl,
          userCustomInput
        });
        
        // Update totalScore if the answer was correct
        if (isCorrect) {
          quizResult.totalScore = (quizResult.totalScore || 0) + 1;
        }
        
        // Update totalQuestions
        quizResult.totalQuestions = (quizResult.totalQuestions || 0) + 1;
        
        // Update totalTimeSpentMs
        quizResult.totalTimeSpentMs = (quizResult.totalTimeSpentMs || 0) + timeSpentMs;
        
        await quizResult.save();
        console.log(`Updated quiz result in database for session ${sessionId}`);
      } else {
        console.log(`Creating new quiz result in database for session ${sessionId}`);
        // Create a new quiz result
        const newQuizResult = new QuizResult({
          quizId: sessionId,
          type: quizType,
          userName: 'Anonymous',
          questionAttempts: [{
            questionId,
            questionText: currentQuestion.question,
            correctCountryId: new mongoose.Types.ObjectId(attempt.correctOptionId),
            selectedCountryId: selectedOptionId ? new mongoose.Types.ObjectId(selectedOptionId) : null,
            isCorrect,
            timeSpentMs,
            imageUrl: currentQuestion.imageUrl,
            userCustomInput
          }],
          totalScore: isCorrect ? 1 : 0,
          totalQuestions: 1,
          totalTimeSpentMs: timeSpentMs
        });
        
        await newQuizResult.save();
      }
    } catch (dbError) {
      console.error('Error updating quiz result in database:', dbError);
      // Continue anyway, the in-memory session is updated
    }
    
    return res.json({
      success: true,
      score: session.score,
      questionCount: session.questionCount
    });
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
      error: error.message
    });
  }
}; 