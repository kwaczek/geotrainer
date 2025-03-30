import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, QuizOption, QuizType } from '../../types/quiz';
import CountryInfoCard from '../CountryInfoCard';
import { CountryInfo } from '../../services/countryService';
import { getImageUrl } from '../../config/apiConfig';
import WriteAnswerInput from './WriteAnswerInput';
import axios from 'axios';
import DescriptionPopup from './DescriptionPopup';

interface GenericQuizComponentProps {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean, optionId: string) => void;
  onNextQuestion: () => void;
  timeLimit?: number;
  selectedOptionId: string | null;
  showFeedback?: boolean;
  quizType?: QuizType;
  isLastQuestion?: boolean;
  writeMode?: boolean;
  settings?: {
    blurred?: boolean;
    blurIntensity?: number;
  };
  onSettingsChange?: (settings: { blurred?: boolean; blurIntensity?: number }) => void;
}

const GenericQuizComponent: React.FC<GenericQuizComponentProps> = ({
  question,
  onAnswer,
  onNextQuestion,
  timeLimit = 30,
  selectedOptionId,
  showFeedback = true,
  quizType = 'flags',
  isLastQuestion = false,
  writeMode = false,
  settings,
  onSettingsChange
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [answered, setAnswered] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(selectedOptionId);
  const [blurIntensity, setBlurIntensity] = useState<number>(settings?.blurIntensity || 15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [correctCountry, setCorrectCountry] = useState<CountryInfo | null>(null);
  const [showCountryInfo, setShowCountryInfo] = useState<boolean>(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean>(false);
  
  // Use a ref to track answer correctness immediately
  const isAnswerCorrectRef = useRef<boolean>(false);
  
  // Keep track of the question ID to detect when we move to a new question
  const questionIdRef = useRef<string | null>(null);
  
  // Store the last answer result to ensure it's preserved during transitions
  const [writeModeResult, setWriteModeResult] = useState<{questionId: string, isCorrect: boolean, userInput: string} | null>(null);

  // Add ref for the next/view results button
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const [showDescription, setShowDescription] = useState(false);

  // Reset timer when question changes
  useEffect(() => {
    // Check if this is a new question
    const isNewQuestion = questionIdRef.current !== question.id;
    console.log('Question change detected, new question:', isNewQuestion, 'prev:', questionIdRef.current, 'curr:', question.id);
    
    if (isNewQuestion) {
      // Update the question ID ref
      questionIdRef.current = question.id;
      
      console.log('Timer limit set to:', timeLimit);
      setTimeLeft(timeLimit);
      setAnswered(!!selectedOptionId);
      setSelectedOption(selectedOptionId);
      setCorrectCountry(null);
      setShowCountryInfo(false);
      
      // Only reset answer state if this is truly a new question
      setLastAnswerCorrect(false);
      isAnswerCorrectRef.current = false;
      
      // Keep write mode result if it's for the current question
      if (writeModeResult && writeModeResult.questionId !== question.id) {
        setWriteModeResult(null);
      }

      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Only start timer if not already answered and timer is enabled
      if (!selectedOptionId && timeLimit > 0) {
        console.log('Starting timer with', timeLimit, 'seconds');
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              // Auto-submit wrong answer on timeout
              const correctOption = question.options.find(opt => opt.isCorrect);
              if (correctOption && !answered) {
                onAnswer(false, correctOption.id);
                setAnswered(true);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (timeLimit <= 0) {
        console.log('Timer is disabled');
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [question, timeLimit, selectedOptionId, onAnswer, answered]);

  // Set correct country info when answered
  useEffect(() => {
    if (answered) {
      const correctOption = question.options.find(opt => opt.isCorrect);
      
      if (correctOption) {
        const fetchCountryDetails = async (countryName: string) => {
          try {
            // Start with basic info
            let countryData: CountryInfo = {
              name: countryName,
              flagUrl: quizType === 'flags' ? question.imageUrl : undefined
            };
            
            // For capitals quiz, add the capital info
            if (quizType === 'capitals') {
              countryData.capital = correctOption.text;
            }
            
            // Show initial data immediately
            setCorrectCountry(countryData);
            setShowCountryInfo(true);
            
            // Then fetch complete data from API
            try {
              const encodedName = encodeURIComponent(countryName);
              const response = await axios.get(`/api/countries/name/${encodedName}`);
              
              if (response.data && response.data.success) {
                const { country } = response.data;
                
                // Update with complete information
                setCorrectCountry({
                  ...country,
                  // Keep the quiz-specific data if not in API response
                  flagUrl: country.flagUrl || (quizType === 'flags' ? question.imageUrl : undefined),
                  capital: country.capital || (quizType === 'capitals' ? correctOption.text : undefined)
                });
              }
            } catch (error) {
              console.log('Could not fetch additional country details, using basic info');
            }
          } catch (error) {
            console.error('Error fetching country details:', error);
          }
        };

        // For capitals quiz, the question text contains the country name
        // Format: "What is the capital of {country}?"
        if (quizType === 'capitals') {
          const countryNameMatch = question.question.match(/capital of (.+)\?/);
          if (countryNameMatch && countryNameMatch[1]) {
            const countryName = countryNameMatch[1];
            fetchCountryDetails(countryName);
          }
        } 
        // For flags and bollards quiz, the correct option text is the country name
        else {
          fetchCountryDetails(correctOption.text);
        }
      }
    }
  }, [answered, question, quizType]);

  // Handle answer selection
  const handleOptionClick = (optionId: string) => {
    if (answered) return;
    
    const selectedOption = question.options.find(opt => opt.id === optionId);
    if (!selectedOption) return;
    
    setAnswered(true);
    setSelectedOption(optionId);
    
    // Update both state and ref
    const isCorrect = selectedOption.isCorrect;
    setLastAnswerCorrect(isCorrect);
    isAnswerCorrectRef.current = isCorrect;
    
    // Debug logging for description popup
    console.log('Answer submitted, has metadata:', !!question.metadata);
    console.log('Description available:', question.metadata?.description);
    
    // Show description immediately if available
    if (question.metadata?.description) {
      console.log('Showing description popup');
      setShowDescription(true);
    } else {
      console.log('No description available for this question');
    }
    
    // Clear timer if it's running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    onAnswer(isCorrect, optionId);
  };

  const getOptionClass = (option: QuizOption) => {
    if (!answered) {
      return 'hover:bg-gray-50 hover:border-gray-300';
    }
    
    if (option.isCorrect) {
      return 'bg-green-100 border-green-500 text-green-800';
    }
    
    if (selectedOption === option.id && !option.isCorrect) {
      return 'bg-red-100 border-red-500 text-red-800';
    }
    
    return 'opacity-70';
  };

  // Get the correct status for the current question in write mode
  const getWriteModeCorrectStatus = () => {
    // If we have a stored result for this question, use it
    if (writeModeResult && writeModeResult.questionId === question.id) {
      return writeModeResult.isCorrect;
    }
    
    // Otherwise use the ref
    return isAnswerCorrectRef.current;
  };

  // Handle write mode input submission
  const handleWriteAnswer = (isCorrect: boolean, inputText: string) => {
    // Update both state and ref immediately before any other operations
    isAnswerCorrectRef.current = isCorrect;
    
    // Store the result with the question ID to ensure it persists
    setWriteModeResult({
      questionId: question.id,
      isCorrect: isCorrect,
      userInput: inputText // Store what the user actually typed
    });
    
    // Then update UI states
    setAnswered(true);
    setLastAnswerCorrect(isCorrect);
    
    // Find the correct option to get its ID and text (country name)
    const correctOption = question.options.find(opt => opt.isCorrect);
    
    if (!correctOption) {
      console.error('Could not find correct option');
      return;
    }
    
    // Modify how we handle the option ID
    let optionId;
    if (isCorrect) {
      // For correct answers, use the correct option's ID
      optionId = correctOption.id;
    } else {
      // For incorrect answers, we want to store what the user actually typed
      // But the API expects an option ID, so we'll pass the correct option ID
      // along with a custom field to indicate what the user actually typed
      // This avoids the random selection of incorrect options
      optionId = correctOption.id + "|CUSTOM:" + inputText;
    }
    
    // Call the original onAnswer function with the result
    onAnswer(isCorrect, optionId);
    
    // Show country info by fetching complete details
    const fetchCountryDetails = async (countryName: string) => {
      try {
        // Start with basic info
        const initialData = {
          name: countryName,
          flagUrl: quizType === 'flags' ? question.imageUrl : undefined
        };
        
        // Show initial data immediately
        setCorrectCountry(initialData);
        setShowCountryInfo(true);
        
        // Then fetch complete details
        try {
          const encodedName = encodeURIComponent(countryName);
          const response = await axios.get(`/api/countries/name/${encodedName}`);
          
          if (response.data && response.data.success) {
            const { country } = response.data;
            
            // Update with complete information
            setCorrectCountry({
              ...country,
              flagUrl: country.flagUrl || (quizType === 'flags' ? question.imageUrl : undefined)
            });
          }
        } catch (error) {
          console.log('Could not fetch additional country details, using basic info');
        }
      } catch (error) {
        console.error('Error fetching country details:', error);
      }
    };
    
    // Fetch complete country details
    fetchCountryDetails(correctOption.text);
    
    // Focus the next button after submission
    setTimeout(() => {
      if (nextButtonRef.current) {
        nextButtonRef.current.focus();
      }
    }, 100);
  };

  // Helper function to check if the current answer is correct
  const isCurrentAnswerCorrect = () => {
    if (writeMode) {
      // In write mode, use the stored result or ref
      const isCorrect = getWriteModeCorrectStatus();
      return isCorrect;
    } else {
      // In multiple choice mode, check if the selected option is correct
      const isCorrect = selectedOption && question.options.find(opt => opt.id === selectedOption)?.isCorrect;
      return !!isCorrect;
    }
  };

  // Handle moving to the next question
  const handleNextClick = () => {
    // Before transitioning to the next question, make sure to preserve the answer correctness state
    // The ref and state will be reset in the useEffect when the new question loads
    // But we need to make sure our current answer result is stored before that happens
    console.log('Moving to next question, current answer was:', isCurrentAnswerCorrect());
    
    // Store the current answer result before moving on
    const currentResult = {
      questionId: question.id,
      isCorrect: isCurrentAnswerCorrect(),
      userInput: 'preserved' // Add this field to match the new state type
    };
    
    // Keep the current result in the write mode result state
    setWriteModeResult(currentResult);
    
    // Then proceed to the next question
    onNextQuestion();
  };

  // Update blur intensity
  const handleBlurIntensityChange = (value: number) => {
    setBlurIntensity(value);
    if (onSettingsChange) {
      onSettingsChange({ ...settings, blurIntensity: value });
    }
  };

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Show debug info in development */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="text-xs text-gray-500 mb-4">
            <div>Debug: writeMode={String(writeMode)}, lastAnswerCorrect={String(lastAnswerCorrect)}</div>
            <div>selectedOption={selectedOption || 'none'}, questionId={question.id}</div>
            <div>tracking: ref={String(isAnswerCorrectRef.current)}, stored={writeModeResult ? JSON.stringify(writeModeResult) : 'none'}</div>
            <div>Question has metadata: {question.metadata ? 'Yes' : 'No'}</div>
            {question.metadata?.allCorrectCountryNames && (
              <div>Valid answers: {question.metadata.allCorrectCountryNames.join(', ')}</div>
            )}
            {question.metadata?.description && (
              <div>Description: {question.metadata.description.substring(0, 50)}...</div>
            )}
            <div>showDescription state: {String(showDescription)}</div>
          </div>
        )}
    
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
          
          {quizType === 'licenseplates' && settings?.blurred && (
            <div className="mb-4">
              <label htmlFor="blur-intensity" className="block text-sm font-medium text-gray-700 mb-2">
                Blur Intensity: {blurIntensity}px
              </label>
              <input
                type="range"
                id="blur-intensity"
                min="1"
                max="30"
                value={blurIntensity}
                onChange={(e) => handleBlurIntensityChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
          
          {question.imageUrl && (
            <div className="flex justify-center mb-4">
              <img 
                src={getImageUrl(question.imageUrl)} 
                alt="Quiz question" 
                className="max-h-64 object-contain rounded-md"
                style={{
                  filter: quizType === 'licenseplates' && settings?.blurred 
                    ? `blur(${blurIntensity}px)` 
                    : 'none'
                }}
              />
            </div>
          )}
          
          {/* Timer display - only show if timer is enabled */}
          {timeLimit > 0 && (
            <div className="mb-4 flex justify-center">
              <div className={`px-4 py-2 rounded-full font-bold ${
                timeLeft > 10 ? 'bg-green-100 text-green-800' : 
                timeLeft > 5 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
              }`}>
                Time left: {timeLeft}s
              </div>
            </div>
          )}
        </div>
        
        {/* Write mode or multiple choice options */}
        {writeMode ? (
          <WriteAnswerInput 
            onSubmit={handleWriteAnswer} 
            correctAnswers={
              // If metadata contains allCorrectCountryNames, use that for write mode
              // This handles cases where multiple countries are valid answers (like bollards)
              question.metadata?.allCorrectCountryNames || 
              // Otherwise fall back to the options marked as correct
              question.options.filter(opt => opt.isCorrect).map(opt => opt.text)
            } 
            disabled={answered}
            onAfterSubmit={() => {
              if (nextButtonRef.current) {
                nextButtonRef.current.focus();
              }
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={answered}
                className={`p-4 rounded-lg border border-gray-200 transition-colors duration-200 ${
                  !answered
                    ? 'hover:bg-gray-50'
                    : option.isCorrect
                    ? 'bg-green-100 border-green-300'
                    : selectedOption === option.id
                    ? 'bg-red-100 border-red-300'
                    : 'opacity-50'
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}
        
        {/* Show feedback banner when answered */}
        {answered && showFeedback && (
          <div className={`mb-6 p-4 rounded-lg ${
            isCurrentAnswerCorrect() 
              ? 'bg-green-100 border border-green-300' 
              : 'bg-red-100 border border-red-300'
          }`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                isCurrentAnswerCorrect() 
                  ? 'bg-green-200' 
                  : 'bg-red-200'
              }`}>
                {/* Show debug value */}
                {process.env.NODE_ENV !== 'production' && (
                  <div className="absolute top-0 right-0 bg-white text-xs px-1 rounded border transform translate-x-2 translate-y-[-8px]">
                    {writeMode ? 'W' : 'M'}:{String(isCurrentAnswerCorrect())}
                  </div>
                )}
                
                {isCurrentAnswerCorrect() ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-4">
                <p className={`text-lg font-semibold ${
                  isCurrentAnswerCorrect() 
                    ? 'text-green-700' 
                    : 'text-red-700'
                }`}>
                  {isCurrentAnswerCorrect() ? 'Correct!' : 'Incorrect'}
                </p>
              </div>
            </div>
            
            {/* Show correct answer when incorrect */}
            {!isCurrentAnswerCorrect() && (
              <div className="mt-2 text-center">
                <p className="text-gray-700">
                  The correct answer was: {
                    question.options
                      .filter(opt => opt.isCorrect)
                      .map(opt => opt.text)
                      .join(' or ')
                  }
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Next Question or View Results button */}
        {answered && (
          <div className="flex justify-center my-6 border-t border-b border-gray-100 py-6">
            <button
              ref={nextButtonRef}
              onClick={handleNextClick}
              className={`font-bold py-3 px-8 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 ${
                isLastQuestion 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLastQuestion ? 'View Results' : 'Next Question'}
            </button>
          </div>
        )}
        
        {/* Display CountryInfoCard when answered */}
        {answered && correctCountry && showCountryInfo && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700">Country Information</h3>
            </div>
            <CountryInfoCard country={correctCountry} isVisible={true} />
          </div>
        )}
      </div>
      
      {/* Description Popup */}
      <DescriptionPopup
        isVisible={showDescription}
        description={question.metadata?.description || ''}
        googleMapsUrl={question.metadata?.googleMapsUrl}
        onClose={() => setShowDescription(false)}
      />
    </div>
  );
};

export default GenericQuizComponent; 