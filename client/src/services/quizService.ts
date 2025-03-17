import axios from 'axios';
import { 
  QuizType, 
  QuizQuestion, 
  QuizFilters, 
  QuestionAttempt, 
  QuizSession,
  QuizResult
} from '../types/quiz';

/**
 * Initialize a new quiz session
 */
export const initializeQuiz = async (
  quizType: QuizType, 
  userName: string = 'Anonymous', 
  filters: QuizFilters = {}
): Promise<{ quizId: string }> => {
  try {
    console.log(`Initializing ${quizType} quiz with filters:`, filters);
    const response = await axios.post('/api/quiz-sessions', {
      type: quizType,
      userName,
      filters
    });
    
    console.log(`Quiz initialized with ID: ${response.data.quizId}`);
    return {
      quizId: response.data.quizId
    };
  } catch (error) {
    console.error(`Error initializing ${quizType} quiz:`, error);
    throw error;
  }
};

/**
 * Get the next question for a quiz
 */
export const getNextQuestion = async (
  quizType: QuizType, 
  sessionId?: string, 
  filters: QuizFilters = {},
  previousQuestionIds: string[] = [],
  previousEntityIds: string[] = []
): Promise<{ question: QuizQuestion, sessionId: string }> => {
  try {
    console.log(`Fetching ${quizType} question with sessionId: ${sessionId || 'none'}`);
    const response = await axios.get(`/api/quiz-questions/${quizType}`, {
      params: {
        sessionId,
        filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
        previousQuestionIds: previousQuestionIds.length > 0 ? JSON.stringify(previousQuestionIds) : undefined,
        previousEntityIds: previousEntityIds.length > 0 ? JSON.stringify(previousEntityIds) : undefined
      }
    });
    
    console.log(`Received question:`, response.data);
    
    // Add additional debug for metadata
    if (process.env.NODE_ENV !== 'production') {
      console.log("Question details:", {
        id: response.data.question.id,
        question: response.data.question.question,
        hasMetadata: !!response.data.question.metadata,
        metadata: response.data.question.metadata,
        options: response.data.question.options?.length || 0
      });
    }
    
    return {
      question: response.data.question,
      sessionId: response.data.sessionId
    };
  } catch (error) {
    console.error(`Error fetching ${quizType} question:`, error);
    throw error;
  }
};

/**
 * Submit an answer for a quiz question
 */
export const submitAnswer = async (
  quizType: QuizType,
  sessionId: string,
  questionId: string,
  selectedOptionId: string,
  isCorrect: boolean,
  timeSpentMs: number,
  userCustomInput?: string
): Promise<{ success: boolean }> => {
  try {
    console.log(`Submitting answer for ${quizType} quiz, sessionId: ${sessionId}`);
    const response = await axios.post(`/api/quiz-answers/${quizType}`, {
      sessionId,
      questionId,
      selectedOptionId,
      isCorrect,
      timeSpentMs,
      userCustomInput
    });
    
    console.log(`Answer submitted successfully:`, response.data);
    return {
      success: response.data.success
    };
  } catch (error) {
    console.error(`Error submitting ${quizType} answer:`, error);
    throw error;
  }
};

/**
 * Complete a quiz and get the results
 */
export const completeQuiz = async (
  quizType: QuizType,
  sessionId: string,
  attempts: QuestionAttempt[]
): Promise<{ quizId: string }> => {
  try {
    console.log(`Completing ${quizType} quiz, sessionId: ${sessionId}`);
    const response = await axios.post(`/api/quiz-sessions/${sessionId}/complete`, {
      type: quizType,
      questionAttempts: attempts
    });
    
    console.log(`Quiz completed successfully:`, response.data);
    return {
      quizId: response.data.quizId
    };
  } catch (error) {
    console.error(`Error completing ${quizType} quiz:`, error);
    throw error;
  }
};

/**
 * Get quiz results by ID
 */
export const getQuizResult = async (quizId: string): Promise<QuizResult> => {
  try {
    console.log(`Fetching quiz result for ID: ${quizId}`);
    const response = await axios.get(`/api/quiz-results/${quizId}`);
    console.log(`Received quiz result:`, response.data);
    return response.data.result;
  } catch (error) {
    console.error(`Error fetching quiz result:`, error);
    throw error;
  }
};

/**
 * Get quiz session by ID
 */
export const getQuizSession = async (sessionId: string): Promise<QuizSession> => {
  try {
    console.log(`Fetching quiz session for ID: ${sessionId}`);
    const response = await axios.get(`/api/quiz-sessions/${sessionId}`);
    console.log(`Received quiz session:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching quiz session:`, error);
    throw error;
  }
}; 