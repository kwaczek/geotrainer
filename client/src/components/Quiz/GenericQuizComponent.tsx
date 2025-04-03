import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, QuizOption, QuizType } from '../../types/quiz';
import CountryInfoCard from '../CountryInfoCard';
import AnimatedCountryInfo from '../AnimatedCountryInfo';
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
  countryData?: any;
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
  onSettingsChange,
  countryData
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
              
              // Fetch country basic data
              const countryResponse = await axios.get(`/api/countries/name/${encodedName}`);
              
              let fullCountryData = countryData;
              if (countryResponse.data && countryResponse.data.success) {
                const { country } = countryResponse.data;
                
                // Update with basic information
                fullCountryData = {
                  ...country,
                  // Keep the quiz-specific data if not in API response
                  flagUrl: country.flagUrl || (quizType === 'flags' ? question.imageUrl : undefined),
                  capital: country.capital || (quizType === 'capitals' ? correctOption.text : undefined)
                };
              }
              
              // Fetch bollards data if country has an ID
              let bollards = [];
              if (fullCountryData.id) {
                try {
                  const bollardsResponse = await axios.get(`/api/bollards/country/${fullCountryData.id}`);
                  if (bollardsResponse.data && bollardsResponse.data.success) {
                    bollards = bollardsResponse.data.bollards || [];
                  }
                } catch (err) {
                  console.log('Could not fetch bollards data');
                }
              }
              
              // Fetch road signs data if country has an ID
              let signs = [];
              if (fullCountryData.id) {
                try {
                  const signsResponse = await axios.get(`/api/roadsigns/country/${fullCountryData.id}`);
                  if (signsResponse.data && signsResponse.data.success) {
                    signs = signsResponse.data.signs || [];
                  }
                } catch (err) {
                  console.log('Could not fetch road signs data');
                }
              }
              
              // Fetch license plates data if country has an ID
              let plates = [];
              if (fullCountryData.id) {
                try {
                  const platesResponse = await axios.get(`/api/licenseplates/country/${fullCountryData.id}`);
                  if (platesResponse.data && platesResponse.data.success) {
                    plates = platesResponse.data.licensePlates || [];
                    // If the response field is differently named, try alternative key
                    if (!plates.length && platesResponse.data.plates) {
                      plates = platesResponse.data.plates;
                    }
                    console.log('License plates data fetched:', plates);
                  }
                } catch (err) {
                  console.log('Could not fetch license plates data', err);
                }
              }
              
              // Update with complete information including related items
              setCorrectCountry({
                ...fullCountryData,
                bollards,
                signs,
                plates
              });
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
    
    const selected = question.options.find(opt => opt.id === optionId);
    if (!selected) return;
    
    const isCorrect = selected.isCorrect;
    isAnswerCorrectRef.current = isCorrect;
    setSelectedOption(optionId);
    setAnswered(true);
    setLastAnswerCorrect(isCorrect);
    onAnswer(isCorrect, optionId);
    
    // Show description popup if metadata exists
    if (question.metadata?.languageName || question.metadata?.correctCountryName) {
        setShowDescription(true);
    }

    // Clear timer if it's running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
    if (answered) return;

    console.log('Handling write answer:', isCorrect, inputText);
    isAnswerCorrectRef.current = isCorrect;
    setAnswered(true);
    setLastAnswerCorrect(isCorrect);
    setWriteModeResult({ questionId: question.id, isCorrect, userInput: inputText });
    
    const correctOption = question.options.find(opt => opt.isCorrect);
    if (correctOption) {
      onAnswer(isCorrect, correctOption.id); 
    }
    
    // Show description popup if metadata exists
    if (question.metadata?.languageName || question.metadata?.correctCountryName) {
        setShowDescription(true);
    }

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

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

  // We need to add a useSideLayout state variable to track the screen width
  const [useSideLayout, setUseSideLayout] = useState<boolean>(false);

  // Add effect to watch window width and determine layout
  useEffect(() => {
    const handleResize = () => {
      // Use the same breakpoint as in AnimatedCountryInfo
      setUseSideLayout(window.innerWidth >= 1200);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative">
      {answered && correctCountry && showCountryInfo && useSideLayout ? (
        <div className="relative">
          {/* Main quiz content - centered with margin for side panels */}
          <div className="max-w-2xl mx-auto z-20 relative px-4">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 relative">
              {/* Debug info in development */}
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

              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-3">{question.question}</h2>
                
                {quizType === 'licenseplates' && settings?.blurred && (
                  <div className="mb-3">
                    <label htmlFor="blur-intensity" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <div className="flex justify-center mb-3">
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
                  <div className="mb-3 flex justify-center">
                    <div className={`px-3 py-1 rounded-full font-bold text-sm ${
                      timeLeft > 10 ? 'bg-green-100 text-green-800' : 
                      timeLeft > 5 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      Time: {timeLeft}s
                    </div>
                  </div>
                )}
              </div>
              
              {/* Write mode or multiple choice options */}
              {writeMode ? (
                <WriteAnswerInput 
                  onSubmit={handleWriteAnswer} 
                  correctAnswers={
                    question.metadata?.allCorrectCountryNames || 
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {question.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option.id)}
                      disabled={answered}
                      className={`p-3 rounded-lg border border-gray-200 transition-colors duration-200 ${
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
                <div className={`mb-4 p-3 rounded-lg ${
                  isCurrentAnswerCorrect() 
                    ? 'bg-green-100 border border-green-300' 
                    : 'bg-red-100 border border-red-300'
                }`}>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      isCurrentAnswerCorrect() 
                        ? 'bg-green-200' 
                        : 'bg-red-200'
                    }`}>
                      {isCurrentAnswerCorrect() ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-base font-semibold ${
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
                      <p className="text-gray-700 text-sm">
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
              
              {/* Next Question/View Results button and Description container */}
              {answered && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 pt-3 border-t border-gray-100">
                  <div className="mb-3 sm:mb-0 sm:mr-4">
                    <button
                      ref={nextButtonRef}
                      onClick={handleNextClick}
                      className={`font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-200 ${
                        isLastQuestion 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isLastQuestion ? 'View Results' : 'Next Question'}
                    </button>
                  </div>
                  
                  {/* Description Popup - Conditionally rendered */}          
                  <DescriptionPopup 
                    isVisible={showDescription} // Use state to control visibility
                    // Get description from metadata if available, otherwise fallback (or hide)
                    description={question.metadata?.languageName || question.metadata?.description || 'No additional info available.'} 
                    onClose={() => setShowDescription(false)}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Animated country info for the sides - will be positioned absolutely */}
          <AnimatedCountryInfo 
            country={correctCountry} 
            isVisible={true} 
            isCorrectAnswer={isCurrentAnswerCorrect()} 
            layout="sides"
          />
        </div>
      ) : (
        <>
          {/* Regular view */}
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 relative">
              {/* Debug info in development */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="text-xs text-gray-500 mb-4">
                  <div>Debug mode content</div>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-3">{question.question}</h2>
                
                {quizType === 'licenseplates' && settings?.blurred && (
                  <div className="mb-3">
                    <label htmlFor="blur-intensity" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <div className="flex justify-center mb-3">
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
                
                {timeLimit > 0 && (
                  <div className="mb-3 flex justify-center">
                    <div className={`px-3 py-1 rounded-full font-bold text-sm ${
                      timeLeft > 10 ? 'bg-green-100 text-green-800' : 
                      timeLeft > 5 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      Time: {timeLeft}s
                    </div>
                  </div>
                )}
              </div>
              
              {writeMode ? (
                <WriteAnswerInput 
                  onSubmit={handleWriteAnswer} 
                  correctAnswers={
                    question.metadata?.allCorrectCountryNames || 
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {question.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option.id)}
                      disabled={answered}
                      className={`p-3 rounded-lg border border-gray-200 transition-colors duration-200 ${
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
              
              {answered && showFeedback && (
                <div className={`mb-4 p-3 rounded-lg ${
                  isCurrentAnswerCorrect() 
                    ? 'bg-green-100 border border-green-300' 
                    : 'bg-red-100 border border-red-300'
                }`}>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      isCurrentAnswerCorrect() 
                        ? 'bg-green-200' 
                        : 'bg-red-200'
                    }`}>
                      {isCurrentAnswerCorrect() ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-base font-semibold ${
                        isCurrentAnswerCorrect() 
                          ? 'text-green-700' 
                          : 'text-red-700'
                      }`}>
                        {isCurrentAnswerCorrect() ? 'Correct!' : 'Incorrect'}
                      </p>
                    </div>
                  </div>
                  
                  {!isCurrentAnswerCorrect() && (
                    <div className="mt-2 text-center">
                      <p className="text-gray-700 text-sm">
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
              
              {answered && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 pt-3 border-t border-gray-100">
                  <div className="mb-3 sm:mb-0 sm:mr-4">
                    <button
                      ref={nextButtonRef}
                      onClick={handleNextClick}
                      className={`font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-200 ${
                        isLastQuestion 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isLastQuestion ? 'View Results' : 'Next Question'}
                    </button>
                  </div>
                  
                  {/* Description Popup - Conditionally rendered */}          
                  <DescriptionPopup 
                    isVisible={showDescription} // Use state to control visibility
                    // Get description from metadata if available, otherwise fallback (or hide)
                    description={question.metadata?.languageName || question.metadata?.description || 'No additional info available.'} 
                    onClose={() => setShowDescription(false)}
                  />
                </div>
              )}
            </div>
            
            {/* Display standard country info below for narrow screens */}
            {answered && correctCountry && showCountryInfo && (
              <AnimatedCountryInfo 
                country={correctCountry} 
                isVisible={true} 
                isCorrectAnswer={isCurrentAnswerCorrect()} 
                layout="standard"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GenericQuizComponent;