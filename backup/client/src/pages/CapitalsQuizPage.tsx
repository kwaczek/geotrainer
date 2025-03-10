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
}

interface QuizFilters {
  continent?: string;
  in_geoguessr?: boolean;  // Updated to match server's snake_case convention
}

interface CapitalsQuizPageProps {
  sessionId?: string;
}

const CapitalsQuizPage: React.FC<CapitalsQuizPageProps> = ({ sessionId: propSessionId }) => {
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
  
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
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
      const newUrl = `/quiz/capitals/session/${id}`;
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
      let endpoint = '/api/quizzes/capitals';
      let params: any = {};
      
      // If we have active filters, use the filtered endpoint
      if (activeFilters && (activeFilters.continent !== 'all' || activeFilters.in_geoguessr)) {
        endpoint = '/api/quizzes/capitals/filtered';
        
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
        response = await axios.get('/api/quizzes/capitals', {
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
      
      if (response.data && response.data.result) {
        const quizData = response.data.result;
        
        // Update state with existing quiz data
        setQuizId(quizData.quizId);
        setScore(quizData.totalScore || 0);
        
        // Load attempts from the quiz data
        if (quizData.questionAttempts && quizData.questionAttempts.length > 0) {
          // Transform server attempts to client format
          const clientAttempts = quizData.questionAttempts.map((attempt: any, index: number) => ({
            questionId: `q-${index + 1}`,
            question: attempt.questionText,
            options: [], // We don't have options in the server data
            selectedOptionId: attempt.selectedCountryId,
            isCorrect: attempt.isCorrect,
            timeSpentMs: attempt.timeSpentMs
          }));
          
          setAttempts(clientAttempts);
          
          // Set the question count based on completed attempts
          const completedCount = clientAttempts.length;
          setQuestionCount(completedCount);
          
          // Set the current question number to the next one
          setCurrentQuestionNumber(completedCount + 1);
        }
        
        setQuizInitialized(true);
        console.log(`Loaded existing quiz session: ${quizData.quizId}`);
        
        // If the quiz is already completed, navigate to results
        if (quizData.isCompleted) {
          navigate(`/quiz-result/${quizData.quizId}`, {
            state: {
              score: quizData.totalScore,
              total: quizData.totalQuestions,
              quizType: 'capitals',
              quizId: quizData.quizId,
              attempts: attempts
            }
          });
          return;
        }
      }
    } catch (err) {
      console.error('Failed to fetch existing quiz data:', err);
      // If we can't fetch the existing quiz, start a new one
      setQuizInitialized(false);
      setQuizId(null);
      dataFetchedRef.current = false; // Reset so we can try again if needed
    } finally {
      setLoading(false);
    }
  }, [existingSessionId, navigate, attempts]);

  const initQuizSession = useCallback(async () => {
    // Only initialize if we haven't already and don't have an existing session
    if (quizInitialized || existingSessionId || dataFetchedRef.current) {
      console.log('Quiz already initialized or using existing session, skipping initialization');
      return;
    }
    
    try {
      dataFetchedRef.current = true; // Mark that we've initialized to prevent infinite loops
      
      const screenSize = `${window.innerWidth}x${window.innerHeight}`;
      
      // Include filters in the initialization payload
      const payload = {
        type: 'capitals',  // Using type instead of quizType to match server expectations
        userName: localStorage.getItem('userName') || 'Anonymous',
        screenSize,
        filters: activeFilters
      };
      
      console.log('Initializing quiz with filters:', activeFilters);
      
      const response = await axios.post('/api/quiz-results/', payload);
      
      const newQuizId = response.data.quizId;
      setQuizId(newQuizId);
      setQuizInitialized(true);
      setCurrentQuestionNumber(1);
      
      // Update URL with the new quiz ID
      updateUrlWithQuizId(newQuizId);
      
      console.log('Quiz session initialized with ID:', newQuizId);
      
      // Explicitly fetch the first question after initialization
      await fetchNewQuestion(true);
    } catch (err) {
      console.error('Failed to initialize quiz session:', err);
      dataFetchedRef.current = false; // Reset so we can try again if needed
      setError('Failed to initialize quiz. Please try again.');
      // Continue anyway - we'll just not track analytics
    }
  }, [quizInitialized, existingSessionId, updateUrlWithQuizId, fetchNewQuestion, activeFilters]);

  const recordQuestionAttempt = useCallback(async (attempt: QuestionAttempt) => {
    if (!quizId) {
      console.error('Cannot record attempt: No quiz ID available');
      return;
    }
    
    try {
      // Transform the attempt data to match the server's expected format
      const serverAttempt = {
        questionText: attempt.question,
        // Extract the correct country ID from the options
        correctCountryId: attempt.options.find(option => option.isCorrect)?.id || '',
        // Use the selected option ID as the selected country ID
        selectedCountryId: attempt.selectedOptionId,
        isCorrect: attempt.isCorrect,
        timeSpentMs: attempt.timeSpentMs
      };
      
      console.log(`Recording attempt for quiz ${quizId}:`, serverAttempt);
      await axios.post(`/api/quiz-results/${quizId}/submit-answer`, serverAttempt);
      console.log('Question attempt recorded successfully');
    } catch (err) {
      console.error('Failed to record question attempt:', err);
      // Continue anyway
    }
  }, [quizId]);

  const completeQuizSession = useCallback(async () => {
    if (!quizId) {
      console.error('Cannot complete quiz: No quiz ID available');
      return null;
    }
    
    try {
      console.log(`Completing quiz session ${quizId} with ${attempts.length} attempts`);
      const response = await axios.post(`/api/quiz-results/${quizId}/complete`);
      console.log('Quiz session completed successfully:', response.data);
      return response.data.result;
    } catch (err) {
      console.error('Failed to complete quiz session:', err);
      return null;
    }
  }, [quizId, attempts.length]);

  const handleAnswer = useCallback((isCorrect: boolean, optionId: string) => {
    setLastAnswerCorrect(isCorrect);
    setSelectedOptionId(optionId);
    
    if (currentQuestion) {
      const timeSpentMs = Date.now() - questionStartTime;
      
      const attempt: QuestionAttempt = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        options: currentQuestion.options,
        selectedOptionId: optionId,
        isCorrect,
        timeSpentMs
      };
      
      setAttempts(prev => [...prev, attempt]);
      
      recordQuestionAttempt(attempt);
      
      // Clear the stored question from sessionStorage when answered
      if (quizId) {
        const storedQuestionKey = `quiz_${quizId}_current_question`;
        sessionStorage.removeItem(storedQuestionKey);
      }
    }
  }, [currentQuestion, questionStartTime, recordQuestionAttempt, quizId]);

  const handleNextQuestion = useCallback(() => {
    setQuestionCount(prevCount => prevCount + 1);
    setCurrentQuestionNumber(prevNum => prevNum + 1);
    
    if (lastAnswerCorrect) {
      setScore(prevScore => prevScore + 1);
    }
    
    setLastAnswerCorrect(false);
    setSelectedOptionId(null);
    setCurrentQuestion(null); // Clear current question to ensure we fetch a new one
    
    // Clear the stored question from sessionStorage when moving to next question
    if (quizId) {
      const storedQuestionKey = `quiz_${quizId}_current_question`;
      sessionStorage.removeItem(storedQuestionKey);
    }
    
    fetchNewQuestion(true); // Force fetch a new question
  }, [lastAnswerCorrect, fetchNewQuestion, quizId]);

  // Initialize activeFilters from location state
  useEffect(() => {
    if (location.state?.filters) {
      console.log('Setting active filters from location state:', location.state.filters);
      setActiveFilters(location.state.filters);
    } else {
      console.log('No filters found in location state, using defaults');
      setActiveFilters({
        continent: 'all',
        in_geoguessr: false
      });
    }
  }, [location.state]);

  // Initial setup - check for existing session or initialize new one
  useEffect(() => {
    if (isInitialMount.current) {
      console.log('CapitalsQuizPage mounted, checking for existing session');
      isInitialMount.current = false;
      
      if (existingSessionId) {
        console.log(`Found existing session ID: ${existingSessionId}`);
        fetchExistingQuizData().then(() => {
          // After fetching existing data, fetch a new question if needed
          if (!currentQuestion) {
            fetchNewQuestion();
          }
        });
      } else {
        console.log('No existing session, initializing new quiz');
        initQuizSession();
      }
    }
  }, [existingSessionId, initQuizSession, fetchExistingQuizData, fetchNewQuestion, currentQuestion]);

  // Fetch question after initialization or data fetch
  useEffect(() => {
    if (quizInitialized && !currentQuestion && !loading && !dataFetchedRef.current) {
      console.log('Quiz initialized but no question loaded, fetching first question');
      fetchNewQuestion();
      dataFetchedRef.current = true;
    }
  }, [quizInitialized, currentQuestion, loading, fetchNewQuestion]);

  useEffect(() => {
    if (questionCount >= 10) {
      // Only complete the quiz if there are attempts
      if (attempts.length > 0) {
        console.log(`Quiz complete with ${attempts.length} attempts, score: ${score}/${questionCount}`);
        completeQuizSession().then(result => {
          navigate(`/quiz-result/${quizId}`, { 
            state: { 
              score, 
              total: questionCount,
              quizType: 'capitals',
              quizId,
              attempts
            } 
          });
        }).catch(error => {
          console.error('Error completing quiz:', error);
          // Still navigate to results even if completion fails
          navigate(`/quiz-result/${quizId}`, { 
            state: { 
              score, 
              total: questionCount,
              quizType: 'capitals',
              quizId,
              attempts
            } 
          });
        });
      } else {
        console.warn('Attempted to complete quiz with no question attempts');
        navigate(`/quiz-result/${quizId}`, { 
          state: { 
            score, 
            total: questionCount,
            quizType: 'capitals',
            quizId,
            attempts
          } 
        });
      }
    }
  }, [questionCount, score, navigate, quizId, attempts, completeQuizSession]);

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
        <h1 className="text-2xl font-bold">Capitals Quiz</h1>
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

export default CapitalsQuizPage;
