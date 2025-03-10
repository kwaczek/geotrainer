import React, { useState, useEffect, useCallback, useRef } from 'react';
import QuizComponent from '../components/Quiz/QuizComponent';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  imageUrl?: string;
  options: Option[];
}

interface QuestionAttempt {
  questionId: string;
  question: string;
  options: Option[];
  selectedOptionId: string | null;
  isCorrect: boolean;
  timeSpentMs: number;
  imageUrl?: string;
}

interface BollardsQuizPageProps {
  sessionId?: string;
}

interface QuizFilters {
  continent?: string;
  in_geoguessr?: boolean;
}

const BollardsQuizPage: React.FC<BollardsQuizPageProps> = ({ sessionId: propSessionId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  
  // Get filters from location state if available
  const filters: QuizFilters = location.state?.filters || {};
  
  // Use sessionId from props or URL params
  const existingSessionId = propSessionId || urlSessionId;
  
  // State
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<{ sessionId: string } | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [quizInitialized, setQuizInitialized] = useState(false);
  const questionStartTime = useRef(Date.now());
  const dataFetchedRef = useRef(false);

  // Fetch question function
  const fetchQuestion = useCallback(async (sessionId?: string) => {
    try {
      setLoading(true);
      
      // If we have a sessionId, first get the session state
      if (sessionId) {
        const sessionResponse = await axios.get(`/api/quiz/bollards/session/${sessionId}`);
        if (sessionResponse.data.success) {
          const { score: savedScore, questionCount: savedCount, attempts: savedAttempts, currentQuestion } = sessionResponse.data;
          setScore(savedScore || 0);
          setQuestionCount(savedCount || 0);
          setCurrentQuestionNumber((savedCount || 0) + 1);
          setAttempts(savedAttempts || []);
          
          // If there's a current question that hasn't been answered yet, use it
          if (currentQuestion && savedAttempts.length === savedCount) {
            setCurrentQuestion(currentQuestion);
            setCurrentQuestionId(currentQuestion.id);
            questionStartTime.current = Date.now();
            setSessionData({ sessionId });
            setLoading(false);
            return;
          }
        }
      }

      // Then get the next question only if we didn't get a current question from session
      const response = await axios.get('/api/quiz/bollards/question', {
        params: { 
          sessionId,
          filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined
        }
      });
      
      setCurrentQuestion(response.data.question);
      setSessionData(response.data.session);
      setCurrentQuestionId(response.data.question.id);
      questionStartTime.current = Date.now();
      
      // If we have a session ID in the response but not in the URL, update the URL
      if (response.data.session?.sessionId && !existingSessionId) {
        const newSessionId = response.data.session.sessionId;
        navigate(`/quiz/bollards/session/${newSessionId}`, { replace: true });
        setQuizId(newSessionId); // Set the quiz ID to match the session ID
      }
    } catch (err) {
      setError('Failed to fetch question');
      console.error('Error fetching question:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate, existingSessionId, filters]);

  // Handle answer submission
  const handleAnswer = async (isCorrect: boolean, optionId: string) => {
    if (!currentQuestion || !currentQuestionId) return;

    const timeSpentMs = Date.now() - questionStartTime.current;
    
    // Update local state
    setSelectedOptionId(optionId);
    setLastAnswerCorrect(isCorrect);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setQuestionCount(prev => prev + 1);
    
    // Create the attempt object with current question data
    const attempt: QuestionAttempt = {
      questionId: currentQuestionId,
      question: currentQuestion.question,
      options: currentQuestion.options,
      selectedOptionId: optionId,
      isCorrect,
      timeSpentMs,
      imageUrl: currentQuestion.imageUrl
    };
    
    // Add to attempts array
    setAttempts(prev => [...prev, attempt]);

    try {
      // Submit answer to server
      await axios.post('/api/quiz/bollards/answer', {
        sessionId: sessionData?.sessionId,
        questionId: currentQuestionId,
        selectedOptionId: optionId,
        timeSpentMs,
        isCorrect
      });

      // If this was the last question (10th), navigate to results
      if (questionCount + 1 >= 10) {
        // Get the correct option from the current question
        const correctOption = currentQuestion.options.find(opt => opt.isCorrect);

        // Create quiz result
        const response = await axios.post('/api/quiz-results', {
          quizId,
          type: 'bollards',
          userName: localStorage.getItem('userName') || 'Anonymous',
          questionAttempts: [...attempts, attempt].map(a => ({
            questionId: a.questionId,
            questionText: a.question,
            correctCountryId: a.options?.find(opt => opt.isCorrect)?.id || correctOption?.id,
            selectedCountryId: a.selectedOptionId,
            isCorrect: a.isCorrect,
            timeSpentMs: a.timeSpentMs,
            imageUrl: a.imageUrl
          }))
        });

        // Navigate to results page using the initialized quiz ID
        navigate(`/quiz-result/${quizId}`, {
          state: {
            score: score + (isCorrect ? 1 : 0),
            total: 10,
            quizType: 'bollards',
            quizId,
            attempts: [...attempts, attempt]
          }
        });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer');
    }
  };

  // Handle moving to next question
  const handleNextQuestion = useCallback(() => {
    if (questionCount < 10) {
      setCurrentQuestionNumber(prev => prev + 1);
      setSelectedOptionId(null);
      setLastAnswerCorrect(null);
      fetchQuestion(sessionData?.sessionId);
    }
  }, [questionCount, fetchQuestion, sessionData?.sessionId]);

  // Initialize the quiz if needed
  const initializeQuiz = useCallback(async () => {
    if (quizInitialized) return;
    
    try {
      setLoading(true);
      
      // Create a new quiz session
      try {
        const response = await axios.post('/api/quiz-results', {
          type: 'bollards',
          userName: localStorage.getItem('userName') || 'Anonymous',
          filters
        });
        
        if (response.data && response.data.quizId) {
          setQuizId(response.data.quizId);
          setQuizInitialized(true);
        } else {
          throw new Error('Failed to initialize quiz session');
        }
      } catch (err) {
        console.error('Error initializing quiz:', err);
        // If the endpoint is not available, just generate a local ID and continue
        const localId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setQuizId(localId);
        setQuizInitialized(true);
      }
    } finally {
      setLoading(false);
    }
  }, [quizInitialized, filters]);

  // Initialize quiz if needed
  useEffect(() => {
    if (!quizInitialized && !existingSessionId) {
      initializeQuiz();
    }
  }, [quizInitialized, existingSessionId, initializeQuiz]);

  // Initial load - only fetch question after quiz is initialized
  useEffect(() => {
    if (!dataFetchedRef.current && (quizInitialized || existingSessionId)) {
      dataFetchedRef.current = true;
      fetchQuestion(existingSessionId);
    }
  }, [existingSessionId, fetchQuestion, quizInitialized]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={() => {
            dataFetchedRef.current = false;
            fetchQuestion(existingSessionId);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bollards Quiz</h1>
        <div className="text-lg">
          Score: <span className="font-bold">{score}</span> / {questionCount}
        </div>
      </div>
      
      {quizId && (
        <div className="mb-4 text-sm text-gray-500 text-center">
          Quiz ID: {quizId}
        </div>
      )}
      
      <div className="mb-4 text-center">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
          Question {currentQuestionNumber} of 10
        </span>
      </div>
      
      {currentQuestion && (
        <QuizComponent
          question={currentQuestion}
          onAnswer={handleAnswer}
          onNextQuestion={handleNextQuestion}
          timeLimit={30}
          selectedOptionId={selectedOptionId}
        />
      )}
    </div>
  );
};

export default BollardsQuizPage; 