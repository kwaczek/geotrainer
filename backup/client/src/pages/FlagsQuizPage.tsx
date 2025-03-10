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

interface QuizFilters {
  continent?: string;
  in_geoguessr?: boolean;  // Updated to match server's snake_case convention
}

interface FlagsQuizPageProps {
  sessionId?: string;
}

const FlagsQuizPage: React.FC<FlagsQuizPageProps> = ({ sessionId: propSessionId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  
  // Get filters from location state if available
  const filters: QuizFilters = location.state?.filters || {};
  
  // Use sessionId from props or URL params
  const existingSessionId = propSessionId || urlSessionId;
  
  // Refs to prevent infinite loops
  const isInitialMount = useRef(true);
  const dataFetchedRef = useRef(false);
  
  // State
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(existingSessionId || null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [quizInitialized, setQuizInitialized] = useState<boolean>(!!existingSessionId);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<QuizFilters>(filters);
  
  // Function to update URL with quiz ID without navigating
  const updateUrlWithQuizId = useCallback((id: string) => {
    if (window.history.pushState) {
      const newUrl = `/quiz/flags/session/${id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  }, []);
  
  // Define fetchNewQuestion first before using it in other hooks
  const fetchNewQuestion = useCallback(async (forceNew = false) => {
    // If we already have a question and we're not forcing a new one, don't fetch
    if (currentQuestion && !forceNew) {
      console.log('Using existing question, not fetching new one');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if we have a stored question in sessionStorage for this quiz session
      if (quizId) {
        const storedQuestionKey = `quiz_${quizId}_current_question`;
        const storedQuestion = sessionStorage.getItem(storedQuestionKey);
        
        if (storedQuestion && !forceNew) {
          console.log('Found stored question in sessionStorage, using it instead of fetching new one');
          const questionData = JSON.parse(storedQuestion);
          setCurrentQuestion(questionData);
          setCurrentQuestionId(questionData.id);
          setQuestionStartTime(Date.now());
          setLoading(false);
          return;
        }
      }
      
      // Determine which endpoint to use based on filters
      let endpoint = '/api/quizzes/flags';
      let params: any = {};
      
      // If we have active filters, use the filtered endpoint
      if (activeFilters && (activeFilters.continent !== 'all' || activeFilters.in_geoguessr)) {
        endpoint = '/api/quizzes/flags/filtered';
        
        if (activeFilters.continent && activeFilters.continent !== 'all') {
          params.continent = activeFilters.continent;
        }
        
        if (activeFilters.in_geoguessr) {
          params.in_geoguessr = 'true';
        }
        
        console.log(`Fetching filtered question with params:`, params);
      } else {
        console.log('Fetching standard question without filters');
      }
      
      let response;
      try {
        response = await axios.get(endpoint, {
          params,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      } catch (filterError) {
        console.error('Error fetching filtered question:', filterError);
        console.log('Falling back to standard endpoint');
        
        // If the filtered endpoint fails, fall back to the standard endpoint
        response = await axios.get('/api/quizzes/flags', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      }
      
      console.log('API Response:', response.data);
      
      const questionData = {
        id: `q-${currentQuestionNumber}`,
        ...response.data
      };
      
      setCurrentQuestion(questionData);
      setCurrentQuestionId(questionData.id);
      setQuestionStartTime(Date.now());
      
      // Store the question in sessionStorage
      if (quizId) {
        const storedQuestionKey = `quiz_${quizId}_current_question`;
        sessionStorage.setItem(storedQuestionKey, JSON.stringify(questionData));
      }
    } catch (err: any) {
      console.error('Error fetching quiz question:', err);
      
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        setError(`Server error: ${err.response.status}. ${err.response.data.message || 'Please try again.'}`);
      } else if (err.request) {
        console.error('Error request:', err.request);
        setError('No response from server. Please check your connection and try again.');
      } else {
        console.error('Error message:', err.message);
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [currentQuestion, currentQuestionNumber, quizId, activeFilters]);
  
  // Check if we need to fetch existing quiz data
  const fetchExistingQuizData = useCallback(async () => {
    if (!existingSessionId || dataFetchedRef.current) return;
    
    try {
      setLoading(true);
      dataFetchedRef.current = true; // Mark that we've fetched data to prevent infinite loops
      
      // Fetch the quiz data from the server
      const response = await axios.get(`/api/quiz-results/${existingSessionId}`);
      
      if (response.data) {
        const quizData = response.data;
        
        // Set the quiz ID
        setQuizId(quizData._id);
        
        // Set the attempts
        if (quizData.questionAttempts && Array.isArray(quizData.questionAttempts)) {
          setAttempts(quizData.questionAttempts.map((attempt: any) => ({
            questionId: attempt._id,
            question: attempt.questionText,
            options: [], // We don't have the options in the stored data
            selectedOptionId: attempt.selectedCountryId,
            isCorrect: attempt.isCorrect,
            timeSpentMs: attempt.timeSpentMs
          })));
        }
        
        // Set the current question number
        setCurrentQuestionNumber((quizData.questionAttempts?.length || 0) + 1);
        
        // Set the score
        setScore(quizData.totalScore || 0);
        
        // Set the question count
        setQuestionCount(quizData.totalQuestions || 0);
        
        // Set the active filters
        if (quizData.filters) {
          setActiveFilters(quizData.filters);
        }
        
        // Set the quiz as initialized
        setQuizInitialized(true);
      }
    } catch (err) {
      console.error('Error fetching existing quiz data:', err);
      // If we can't fetch the existing quiz, just start a new one
      setQuizInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [existingSessionId]);
  
  // Initialize the quiz if needed
  const initializeQuiz = useCallback(async () => {
    if (quizInitialized) return;
    
    try {
      setLoading(true);
      
      // Create a new quiz session
      try {
        const response = await axios.post('/api/quiz-results', {
          type: 'flags',  // Using type instead of quizType to match server expectations
          userName: localStorage.getItem('userName') || 'Anonymous',
          filters: activeFilters
        });
        
        if (response.data && response.data.quizId) {
          setQuizId(response.data.quizId);
          updateUrlWithQuizId(response.data.quizId);
          setQuizInitialized(true);
        } else {
          throw new Error('Failed to initialize quiz session');
        }
      } catch (err) {
        console.error('Error initializing quiz:', err);
        // If the endpoint is not available, just generate a local ID and continue
        const localId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setQuizId(localId);
        updateUrlWithQuizId(localId);
        setQuizInitialized(true);
      }
    } finally {
      setLoading(false);
    }
  }, [quizInitialized, activeFilters, updateUrlWithQuizId]);
  
  // Set active filters from location state
  useEffect(() => {
    if (location.state?.filters) {
      setActiveFilters(location.state.filters);
    }
  }, [location.state]);
  
  // Fetch existing quiz data if we have a session ID
  useEffect(() => {
    fetchExistingQuizData();
  }, [fetchExistingQuizData]);
  
  // Initialize quiz if needed
  useEffect(() => {
    if (!quizInitialized && !existingSessionId) {
      initializeQuiz();
    }
  }, [quizInitialized, existingSessionId, initializeQuiz]);
  
  // Fetch first question when quiz is initialized
  useEffect(() => {
    if (quizInitialized && !currentQuestion) {
      fetchNewQuestion();
    }
  }, [quizInitialized, currentQuestion, fetchNewQuestion]);
  
  // End the quiz after 10 questions
  useEffect(() => {
    if (questionCount >= 10) {
      // Only complete the quiz if there are attempts
      if (attempts.length > 0) {
        console.log(`Quiz complete with ${attempts.length} attempts, score: ${score}/${questionCount}`);
        
        // Clear the stored question from sessionStorage
        if (quizId) {
          const storedQuestionKey = `quiz_${quizId}_current_question`;
          sessionStorage.removeItem(storedQuestionKey);
        }
        
        // Complete the quiz session and navigate to results
        if (quizId && !quizId.startsWith('local-')) {
          axios.post(`/api/quiz-results/${quizId}/complete`)
            .catch(error => {
              console.error('Error completing quiz:', error);
            })
            .finally(() => {
              navigate(`/quiz-result/${quizId}`, { 
                state: { 
                  score, 
                  total: questionCount,
                  quizType: 'flags',
                  quizId,
                  attempts
                } 
              });
            });
        } else {
          navigate(`/quiz-result/${quizId}`, { 
            state: { 
              score, 
              total: questionCount,
              quizType: 'flags',
              quizId,
              attempts
            } 
          });
        }
      }
    }
  }, [questionCount, score, navigate, quizId, attempts]);
  
  // Handle answer submission
  const handleAnswer = async (isCorrect: boolean, optionId: string) => {
    if (!currentQuestion || !currentQuestionId) return;
    
    const timeSpentMs = Date.now() - questionStartTime;
    
    // Update local state
    setSelectedOptionId(optionId);
    setLastAnswerCorrect(isCorrect);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setQuestionCount(prev => prev + 1);
    
    // Create the attempt object
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
    
    // Only try to submit to server if we have a non-local quizId
    if (quizId && !quizId.startsWith('local-')) {
      try {
        // Submit the answer to the server
        await axios.post(`/api/quiz-results/${quizId}/submit-answer`, {
          questionText: currentQuestion.question,
          correctCountryId: currentQuestion.options.find(opt => opt.isCorrect)?.id,
          selectedCountryId: optionId,
          isCorrect,
          timeSpentMs
        });
        
        // Clear the stored question from sessionStorage
        const storedQuestionKey = `quiz_${quizId}_current_question`;
        sessionStorage.removeItem(storedQuestionKey);
        
      } catch (err) {
        console.error('Error submitting answer:', err);
        // Continue anyway, the local state is updated
      }
    } else {
      // For local quiz sessions, just store in sessionStorage
      const attemptsKey = `quiz_${quizId}_attempts`;
      const storedAttempts = JSON.parse(sessionStorage.getItem(attemptsKey) || '[]');
      storedAttempts.push({
        questionText: currentQuestion.question,
        correctCountryId: currentQuestion.options.find(opt => opt.isCorrect)?.id,
        selectedCountryId: optionId,
        isCorrect,
        timeSpentMs
      });
      sessionStorage.setItem(attemptsKey, JSON.stringify(storedAttempts));
      
      // Clear the stored question from sessionStorage
      const storedQuestionKey = `quiz_${quizId}_current_question`;
      sessionStorage.removeItem(storedQuestionKey);
    }
  };
  
  // Handle moving to the next question
  const handleNextQuestion = () => {
    // Clear the stored question from sessionStorage
    if (quizId) {
      const storedQuestionKey = `quiz_${quizId}_current_question`;
      sessionStorage.removeItem(storedQuestionKey);
    }
    
    setCurrentQuestionNumber(prev => prev + 1);
    setCurrentQuestion(null);
    setSelectedOptionId(null);
    fetchNewQuestion(true);
  };
  
  // Handle finishing the quiz
  const handleFinishQuiz = async () => {
    // Clear the stored question from sessionStorage
    if (quizId) {
      const storedQuestionKey = `quiz_${quizId}_current_question`;
      sessionStorage.removeItem(storedQuestionKey);
    }
    
    if (quizId && !quizId.startsWith('local-')) {
      try {
        // Mark the quiz as completed
        await axios.post(`/api/quiz-results/${quizId}/complete`);
      } catch (err) {
        console.error('Error completing quiz:', err);
      }
    }
    
    navigate(`/quiz-result/${quizId}`, { 
      state: { 
        score,
        total: questionCount,
        quizType: 'flags',
        quizId,
        attempts
      } 
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={() => fetchNewQuestion(true)}
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
        <h1 className="text-2xl font-bold">Flags Quiz</h1>
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
          question={{
            id: currentQuestion.id,
            question: currentQuestion.question,
            options: currentQuestion.options,
            imageUrl: currentQuestion.imageUrl
          }}
          onAnswer={handleAnswer}
          onNextQuestion={handleNextQuestion}
          timeLimit={30}
        />
      )}
    </div>
  );
};

export default FlagsQuizPage;
