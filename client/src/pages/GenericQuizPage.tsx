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
import { getSettings } from '../utils/settingsStorage';

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

  // First try to get custom settings from location state
  // If not available, load from localStorage
  // If still not available, use defaults from quiz config
  const customSettings: QuizSettings = location.state?.settings ||
    getSettings(quizType) || {
      timerEnabled: true,
      timerDuration: QUIZ_CONFIGS[quizType].timeLimit,
      questionCount: QUIZ_CONFIGS[quizType].questionsPerQuiz
    };

  // Debug log to check settings
  console.log('Custom settings used:', customSettings);
  console.log('Location state:', location.state);

  // Use sessionId from props or URL params
  const existingSessionId = propSessionId || urlSessionId;

  // Get quiz config
  const quizConfig = QUIZ_CONFIGS[quizType];

  // Set the document title for the quiz page
  useDocumentTitle(`${quizConfig.title}`, true);

  // Function to clean up stale quiz sessions (older than 24 hours)
  const cleanupStaleSessions = useCallback(() => {
    const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
    const now = new Date().getTime();
    let cleanupCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('quiz_session_')) {
        try {
          const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
          const lastUpdated = new Date(sessionData.lastUpdated).getTime();

          if (now - lastUpdated > MAX_AGE_MS) {
            localStorage.removeItem(key);
            cleanupCount++;
          }
        } catch (e) {
          // If we can't parse the session data, it's probably corrupted, so remove it
          localStorage.removeItem(key);
          cleanupCount++;
        }
      }
    }

    if (cleanupCount > 0) {
      console.log(`Cleaned up ${cleanupCount} stale quiz sessions`);
    }
  }, []);

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
  const [previousQuestionIds, setPreviousQuestionIds] = useState<string[]>([]);
  const [previousEntityIds, setPreviousEntityIds] = useState<string[]>([]);
  const questionStartTime = useRef(Date.now());
  const dataFetchedRef = useRef(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Function to cleanup duplicate sessions for the current quiz
  const cleanupDuplicateSessions = useCallback(() => {
    if (!sessionId) return;

    // Get all keys from localStorage that are quiz sessions
    const sessionKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('quiz_session_')) {
        sessionKeys.push(key);
      }
    }

    // Keep sessions matching our current sessionId, and recent sessions of the same quiz type
    sessionKeys.forEach(key => {
      if (key !== `quiz_session_${sessionId}`) {
        try {
          const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
          // If this is the same quiz type but a different session, remove it
          if (sessionData.quizType === quizType) {
            console.log(`Removing duplicate session: ${key}`);
            localStorage.removeItem(key);
          }
        } catch (e) {
          // If we can't parse the session data, it's probably corrupted, so remove it
          localStorage.removeItem(key);
        }
      }
    });
  }, [sessionId, quizType]);

  // Save session state to localStorage
  const saveSessionState = useCallback(() => {
    if (sessionId && !quizCompleted) {  // Don't save if quiz is completed
      const sessionState = {
        sessionId,
        quizType,
        score,
        questionCount,
        attempts,
        currentQuestionNumber,
        lastAnswered: questionCount > 0, // Track if we've answered the current question
        lastUpdated: new Date().toISOString(),
        settings: customSettings, // Save custom settings
        previousQuestionIds,  // Save previous question IDs
        previousEntityIds     // Save previous entity IDs
      };
      localStorage.setItem(`quiz_session_${sessionId}`, JSON.stringify(sessionState));
      console.log('Saved session state to localStorage:', sessionState);
    }
  }, [sessionId, quizType, score, questionCount, attempts, currentQuestionNumber, customSettings, previousQuestionIds, previousEntityIds, quizCompleted]);

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

            // Load previously seen question IDs
            if (parsedState.previousQuestionIds) {
              setPreviousQuestionIds(parsedState.previousQuestionIds);
            }

            // Load previously seen entity IDs
            if (parsedState.previousEntityIds) {
              setPreviousEntityIds(parsedState.previousEntityIds);
            }

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

  // Initialize quiz (only called if we don't already have a session ID)
  const initializeQuiz = useCallback(async () => {
    // If we already have a sessionId from the URL, don't initialize a new quiz
    if (quizInitialized || existingSessionId) return;

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
  }, [quizInitialized, existingSessionId, quizType, filters, navigate, customSettings]);

  // Fetch question function
  const fetchQuestion = useCallback(async () => {
    try {
      setLoading(true);

      console.log(`Fetching question for ${quizType}, session: ${sessionId}, question number: ${currentQuestionNumber}`);
      console.log('Using custom settings:', customSettings);
      console.log('Previous question IDs:', previousQuestionIds);
      console.log('Previous entity IDs:', previousEntityIds);

      // Add custom settings to the filters
      const enhancedFilters = {
        ...filters,
        questionCount: customSettings.questionCount
      };

      // If we have a sessionId, try to get the next question
      const response = await quizService.getNextQuestion(
        quizType,
        sessionId || undefined,
        enhancedFilters,
        previousQuestionIds,
        previousEntityIds
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
  }, [quizType, sessionId, filters, navigate, existingSessionId, currentQuestionNumber, customSettings, previousQuestionIds, previousEntityIds]);

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

    // Add the current question ID to the list of seen questions
    if (currentQuestionId) {
      setPreviousQuestionIds(prev => [...prev, currentQuestionId]);
    }

    // Extract the actual option ID without any custom input part
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

    // Add only the correct entity ID to the exclusion list
    // For flags/capitals, this is the country that was the subject of the question
    // For bollards/license plates, this is the actual bollard/plate ID
    if (quizType === 'flags' || quizType === 'capitals') {
      // For flags and capitals, the entity ID is in the option's ID
      // (the country whose flag or capital was being asked about)
      const entityId = correctOption.id;
      if (!previousEntityIds.includes(entityId)) {
        setPreviousEntityIds(prev => [...prev, entityId]);
      }
      console.log(`Adding entity ID to exclusion list for ${quizType}: ${entityId} (${correctOption.text})`);
    } else if (quizType === 'bollards' || quizType === 'licenseplates' || quizType === 'roadsigns' || quizType === 'cars' || quizType === 'poles') {
      // For bollards, license plates, road signs, cars, and poles, we can get the ID from metadata
      if (currentQuestion.metadata) {
        let entityId = '';
        if (quizType === 'bollards' && currentQuestion.metadata.bollardId) {
          entityId = String(currentQuestion.metadata.bollardId);
        } else if (quizType === 'licenseplates' && currentQuestion.metadata.licensePlateId) {
          entityId = String(currentQuestion.metadata.licensePlateId);
        } else if (quizType === 'roadsigns' && currentQuestion.metadata.roadSignId) {
          entityId = String(currentQuestion.metadata.roadSignId);
        } else if (quizType === 'cars' && currentQuestion.metadata.entityId) {
          entityId = String(currentQuestion.metadata.entityId);
        } else if (quizType === 'poles' && currentQuestion.metadata.poleId) {
          entityId = String(currentQuestion.metadata.poleId);
        } else if (quizType === 'roadsigns') { // Fallback for road signs uses question ID
          entityId = currentQuestion.id;
        }

        if (entityId && !previousEntityIds.includes(entityId)) {
          setPreviousEntityIds(prev => [...prev, entityId]);
          console.log(`Adding entity ID to exclusion list for ${quizType}: ${entityId}`);
        }
      }
    } else if (quizType === 'languages') { // Separate check for languages
        // For languages, the entity ID is the question ID itself
        const entityId = currentQuestion.id;
        if (entityId && !previousEntityIds.includes(entityId)) {
          setPreviousEntityIds(prev => [...prev, entityId]);
          console.log(`Adding entity ID to exclusion list for ${quizType}: ${entityId}`);
        }
    } else if (quizType === 'domains') { // Handle domains quiz
        // For domains, the entity ID is the country ID in the metadata
        if (currentQuestion.metadata && currentQuestion.metadata.entityId) {
          const entityId = String(currentQuestion.metadata.entityId);
          if (entityId && !previousEntityIds.includes(entityId)) {
            setPreviousEntityIds(prev => [...prev, entityId]);
            console.log(`Adding entity ID to exclusion list for ${quizType}: ${entityId} (${correctOption.text})`);
          }
        } else if (currentQuestion.metadata && currentQuestion.metadata.countryId) {
          // Fallback to countryId if entityId is not available
          const entityId = String(currentQuestion.metadata.countryId);
          if (entityId && !previousEntityIds.includes(entityId)) {
            setPreviousEntityIds(prev => [...prev, entityId]);
            console.log(`Adding entity ID to exclusion list for ${quizType}: ${entityId} (${correctOption.text})`);
          }
        }
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

  // Clean up stale and duplicate sessions on component mount
  useEffect(() => {
    cleanupStaleSessions();
    if (sessionId) {
      cleanupDuplicateSessions();
    }
  }, [cleanupStaleSessions, cleanupDuplicateSessions, sessionId]);

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

      // Mark quiz as completed to prevent recreating the localStorage entry
      setQuizCompleted(true);

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

        // Clean up localStorage for this session
        if (sessionId) {
          localStorage.removeItem(`quiz_session_${sessionId}`);
          console.log(`Removed completed quiz session from localStorage: quiz_session_${sessionId}`);
        }
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
      setError('Failed to end quiz. Please try again.');
      setLoading(false);
    }
  }, [
    quizType,
    sessionId,
    attempts,
    saveSessionState,
    score,
    customSettings,
    navigate,
    quizId,
    quizCompleted
  ]);

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
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Home</span>
        </button>

        <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-800 flex items-center">
          <span>Question {currentQuestionNumber}/{customSettings.questionCount}</span>
          <span className="mx-1.5 text-blue-500">•</span>
          <span>Score: {score}</span>
        </div>
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
          settings={{
            blurred: location.state?.settings?.blurred,
            blurIntensity: location.state?.settings?.blurIntensity
          }}
          onSettingsChange={(newSettings) => {
            // Update the location state with new settings
            navigate(`/quiz/${quizType}/session/${sessionId}`, {
              replace: true,
              state: {
                ...location.state,
                settings: {
                  ...location.state?.settings,
                  ...newSettings
                }
              }
            });
          }}
        />
      )}
    </div>
  );
};

export default GenericQuizPage;