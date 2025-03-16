import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import GenericQuizComponent from '../components/Quiz/GenericQuizComponent';
import { 
  QuizType, 
  QuizQuestion, 
  QuestionAttempt, 
  QuizFilters 
} from '../types/quiz';
import { QUIZ_CONFIGS } from '../config/quizConfig';
import * as quizService from '../services/quizService';
import useDocumentTitle from '../hooks/useDocumentTitle';

// Interface for custom quiz settings
interface QuizSettings {
  timerEnabled: boolean;
  timerDuration: number;
  questionCount: number;
  writeMode?: boolean;
}

interface GenericQuizPageProps {
  quizType: QuizType;
  sessionId?: string;
}

const GenericQuizPage: React.FC<GenericQuizPageProps> = ({ quizType, sessionId: propSessionId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  
  // Get filters from location state if available
  const filters: QuizFilters = location.state?.filters || {};
  
  // Get custom settings from location state if available
  const customSettings: QuizSettings = location.state?.settings || {
    timerEnabled: true,
    timerDuration: QUIZ_CONFIGS[quizType].timeLimit,
    questionCount: QUIZ_CONFIGS[quizType].questionsPerQuiz
  };
  
  // Debug log to check settings
  console.log('Custom settings received:', customSettings);
  console.log('Location state:', location.state);
  
  // Use sessionId from props or URL params
  const existingSessionId = propSessionId || urlSessionId;
  
  // Get quiz config
  const quizConfig = QUIZ_CONFIGS[quizType];
  
  // Set the document title for the quiz page
  useDocumentTitle(`${quizConfig.title}`, true);
  
  // State
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId || null);
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

  // Save session state to localStorage
  const saveSessionState = useCallback(() => {
    if (sessionId) {
      const sessionState = {
        sessionId,
        quizType,
        score,
        questionCount,
        attempts,
        currentQuestionNumber,
        lastAnswered: questionCount > 0, // Track if we've answered the current question
        lastUpdated: new Date().toISOString(),
        settings: customSettings // Save custom settings
      };
      localStorage.setItem(`quiz_session_${sessionId}`, JSON.stringify(sessionState));
      console.log('Saved session state to localStorage:', sessionState);
    }
  }, [sessionId, quizType, score, questionCount, attempts, currentQuestionNumber, customSettings]);

  // Load session state from localStorage
  const loadSessionState = useCallback(() => {
    if (sessionId) {
      const savedState = localStorage.getItem(`quiz_session_${sessionId}`);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          console.log('Loaded session state from localStorage:', parsedState);
          
          // Only restore state if it's for the same quiz type
          if (parsedState.quizType === quizType) {
            setScore(parsedState.score || 0);
            setQuestionCount(parsedState.questionCount || 0);
            setAttempts(parsedState.attempts || []);
            
            // Load custom settings if available
            if (parsedState.settings) {
              console.log('Loaded custom settings from localStorage:', parsedState.settings);
              
              // Create enhanced filters with the custom question count
              const enhancedFilters = {
                ...filters,
                questionCount: parsedState.settings.questionCount
              };
              
              // We can't directly update customSettings since it's from location state
              // But we can update the URL with the settings to ensure they're used
              navigate(`/quiz/${quizType}/session/${sessionId}`, { 
                replace: true,
                state: {
                  filters: enhancedFilters,
                  settings: parsedState.settings
                }
              });
            }
            
            // If we've already answered questions, set the current question number correctly
            if (parsedState.questionCount > 0) {
              // If we've answered the last question, we should be on the next question
              if (parsedState.lastAnswered) {
                setCurrentQuestionNumber(parsedState.questionCount + 1);
              } else {
                setCurrentQuestionNumber(parsedState.currentQuestionNumber || 1);
              }
            } else {
              setCurrentQuestionNumber(1);
            }
            
            return true;
          }
        } catch (err) {
          console.error('Error parsing saved session state:', err);
        }
      }
    }
    return false;
  }, [sessionId, quizType, navigate, filters]);

  // Initialize the quiz if needed
  const initializeQuiz = useCallback(async () => {
    if (quizInitialized) return;
    
    try {
      setLoading(true);
      
      console.log('Initializing quiz with custom settings:', customSettings);
      
      // Create a new quiz session
      try {
        // Add custom settings to the filters
        const enhancedFilters = {
          ...filters,
          questionCount: customSettings.questionCount
        };
        
        const response = await quizService.initializeQuiz(
          quizType,
          localStorage.getItem('userName') || 'Anonymous',
          enhancedFilters
        );
        
        if (response && response.quizId) {
          setQuizId(response.quizId);
          setSessionId(response.quizId); // Use the same ID for both quiz and session
          setQuizInitialized(true);
          
          // Update URL with the new session ID while preserving the settings
          navigate(`/quiz/${quizType}/session/${response.quizId}`, { 
            replace: true,
            state: {
              filters: enhancedFilters,
              settings: customSettings
            }
          });
        } else {
          throw new Error('Failed to initialize quiz session');
        }
      } catch (err) {
        console.error('Error initializing quiz:', err);
        // If the endpoint is not available, just generate a local ID and continue
        const localId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setQuizId(localId);
        setSessionId(localId);
        setQuizInitialized(true);
      }
    } finally {
      setLoading(false);
    }
  }, [quizInitialized, quizType, filters, navigate, customSettings]);

  // Fetch question function
  const fetchQuestion = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log(`Fetching question for ${quizType}, session: ${sessionId}, question number: ${currentQuestionNumber}`);
      console.log('Using custom settings:', customSettings);
      
      // Add custom settings to the filters
      const enhancedFilters = {
        ...filters,
        questionCount: customSettings.questionCount
      };
      
      // If we have a sessionId, try to get the next question
      const response = await quizService.getNextQuestion(
        quizType,
        sessionId || undefined,
        enhancedFilters
      );
      
      setCurrentQuestion(response.question);
      setCurrentQuestionId(response.question.id);
      
      // If we got a new sessionId, update it
      if (response.sessionId && (!sessionId || response.sessionId !== sessionId)) {
        setSessionId(response.sessionId);
        
        // Update URL with the new session ID if needed, preserving settings
        if (!existingSessionId) {
          navigate(`/quiz/${quizType}/session/${response.sessionId}`, { 
            replace: true,
            state: {
              filters: enhancedFilters,
              settings: customSettings
            }
          });
        }
      }
      
      questionStartTime.current = Date.now();
    } catch (err) {
      console.error('Error fetching question:', err);
      setError('Failed to fetch question');
    } finally {
      setLoading(false);
    }
  }, [quizType, sessionId, filters, navigate, existingSessionId, currentQuestionNumber, customSettings]);

  // Handle answer submission
  const handleAnswer = async (isCorrect: boolean, optionId: string) => {
    if (!currentQuestion || !currentQuestionId || !sessionId) return;

    const timeSpentMs = Date.now() - questionStartTime.current;
    
    // Update local state
    setSelectedOptionId(optionId);
    setLastAnswerCorrect(isCorrect);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setQuestionCount(prev => prev + 1);
    
    // Check if optionId contains a custom input (for write mode)
    let actualOptionId = optionId;
    let userCustomInput = '';
    if (optionId.includes('|CUSTOM:')) {
      const [originalId, customPart] = optionId.split('|CUSTOM:');
      actualOptionId = originalId;
      userCustomInput = customPart;
      console.log('Extracted custom user input:', userCustomInput);
    }
    
    // Find the selected option and correct option
    const selectedOption = currentQuestion.options.find(opt => opt.id === actualOptionId);
    const correctOption = currentQuestion.options.find(opt => opt.isCorrect);
    
    if (!correctOption) {
      console.error('Could not find correct option');
      return;
    }
    
    // Handle case where selected option might not be found (e.g., in write mode)
    let selectedCountryName = '';
    if (selectedOption) {
      // For correct answers or regular multiple choice
      selectedCountryName = selectedOption.text;
    } else if (!isCorrect && userCustomInput) {
      // For write mode with incorrect answers, use what the user actually typed
      selectedCountryName = userCustomInput;
    } else if (!isCorrect) {
      // Fallback for any other case
      selectedCountryName = 'Custom input (incorrect)';
    }
    
    // Create an attempt object
    const attempt: QuestionAttempt = {
      questionId: currentQuestionId,
      questionText: currentQuestion.question,
      correctOptionId: correctOption.id,
      selectedOptionId: actualOptionId,
      isCorrect,
      timeSpentMs,
      imageUrl: currentQuestion.imageUrl,
      selectedCountryName: selectedCountryName,
      correctCountryName: correctOption.text,
      userCustomInput: userCustomInput // Add the user's custom input if applicable
    };
    
    // Add the attempt to our list
    const updatedAttempts = [...attempts, attempt];
    setAttempts(updatedAttempts);
    
    // Save the session state after updating state values
    // (The saveSessionState function will use the component state directly)
    saveSessionState();
    
    try {
      // Submit the answer to the server
      await quizService.submitAnswer(
        quizType,
        sessionId,
        currentQuestionId,
        actualOptionId, // Use the extracted option ID without the custom part
        isCorrect,
        timeSpentMs,
        userCustomInput // Pass the custom input as an additional parameter
      );
      
      // We no longer immediately end the quiz on the last question
      // Instead, we'll show a "View Results" button in the UI
      // The user will need to click it to see the results
    } catch (err) {
      console.error('Error submitting answer:', err);
      // Continue anyway - we'll handle it locally
    }
  };

  // Handle next question
  const handleNextQuestion = () => {
    // Check if we've reached the end of the quiz
    if (currentQuestionNumber >= customSettings.questionCount) {
      // End the quiz
      endQuiz();
    } else {
      // Move to the next question
      setCurrentQuestionNumber(prev => prev + 1);
      setSelectedOptionId(null);
      setLastAnswerCorrect(null);
      fetchQuestion();
    }
  };

  // Initialize quiz if needed
  useEffect(() => {
    if (!quizInitialized && !existingSessionId) {
      initializeQuiz();
    } else if (existingSessionId) {
      setQuizInitialized(true);
      setSessionId(existingSessionId);
      setQuizId(existingSessionId);
    }
  }, [quizInitialized, existingSessionId, initializeQuiz]);

  // Initial load - only fetch question after quiz is initialized and session state is loaded
  useEffect(() => {
    if (!dataFetchedRef.current && (quizInitialized || existingSessionId)) {
      // Mark as fetched first to prevent multiple calls
      dataFetchedRef.current = true;
      
      // First try to load session state
      const stateLoaded = loadSessionState();
      console.log(`Session state loaded: ${stateLoaded}, Current question number: ${currentQuestionNumber}`);
      
      // Then fetch the question
      fetchQuestion();
    }
  }, [quizInitialized, existingSessionId, fetchQuestion, loadSessionState, currentQuestionNumber]);

  // Save session state on unmount
  useEffect(() => {
    return () => {
      saveSessionState();
    };
  }, [saveSessionState]);

  // End the quiz and navigate to results
  const endQuiz = useCallback(async () => {
    try {
      setLoading(true);
      
      // Save the final state
      saveSessionState();
      
      console.log('Ending quiz with attempts:', attempts);
      
      // Complete the quiz on the server
      let result;
      try {
        result = await quizService.completeQuiz(
          quizType,
          sessionId || '',
          attempts
        );
      } catch (err) {
        console.error('Error completing quiz on server:', err);
        // Create a local result if server fails
        result = {
          quizId: quizId || sessionId || `local-${Date.now()}`,
          quizType,
          score,
          total: customSettings.questionCount
        };
      }
      
      // Track quiz completion with Umami
      if (window.umami) {
        window.umami.track('Quiz Completed', {
          quizType,
          score,
          total: customSettings.questionCount,
          accuracy: Math.round((score / customSettings.questionCount) * 100)
        });
      }
      
      // Navigate to results page with all attempts
      navigate(`/quiz-result/${result.quizId}`, {
        state: {
          score,
          total: customSettings.questionCount,
          quizType,
          quizId: result.quizId,
          attempts
        }
      });
    } catch (err) {
      console.error('Error ending quiz:', err);
      setError('Failed to complete quiz');
    } finally {
      setLoading(false);
    }
  }, [quizType, sessionId, score, attempts, navigate, saveSessionState, quizId, customSettings.questionCount]);

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
            fetchQuestion();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Home
        </button>
        
        <div className="text-lg font-semibold">
          Score: {score}/{questionCount}
        </div>
      </div>
      
      {quizId && (
        <div className="mb-4 text-sm text-gray-500 text-center">
          Quiz ID: {quizId}
        </div>
      )}
      
      <div className="mb-4 text-center">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
          Question {currentQuestionNumber} of {customSettings.questionCount}
        </span>
      </div>
      
      {currentQuestion && (
        <GenericQuizComponent
          question={currentQuestion}
          onAnswer={handleAnswer}
          onNextQuestion={handleNextQuestion}
          timeLimit={customSettings.timerEnabled ? customSettings.timerDuration : 0}
          selectedOptionId={selectedOptionId}
          quizType={quizType}
          isLastQuestion={currentQuestionNumber === customSettings.questionCount}
          writeMode={customSettings.writeMode}
        />
      )}
    </div>
  );
};

export default GenericQuizPage; 