import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, QuizOption, QuizType } from '../../types/quiz';
import CountryInfoCard from '../CountryInfoCard';
import { CountryInfo } from '../../services/countryService';
import { getImageUrl } from '../../config/apiConfig';

interface GenericQuizComponentProps {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean, optionId: string) => void;
  onNextQuestion: () => void;
  timeLimit?: number;
  selectedOptionId: string | null;
  showFeedback?: boolean;
  quizType?: QuizType;
  isLastQuestion?: boolean;
}

const GenericQuizComponent: React.FC<GenericQuizComponentProps> = ({
  question,
  onAnswer,
  onNextQuestion,
  timeLimit = 30,
  selectedOptionId,
  showFeedback = true,
  quizType = 'flags',
  isLastQuestion = false
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [answered, setAnswered] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(selectedOptionId);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [correctCountry, setCorrectCountry] = useState<CountryInfo | null>(null);
  const [showCountryInfo, setShowCountryInfo] = useState<boolean>(false);

  // Reset timer when question changes
  useEffect(() => {
    console.log('Timer limit set to:', timeLimit);
    setTimeLeft(timeLimit);
    setAnswered(!!selectedOptionId);
    setSelectedOption(selectedOptionId);
    setCorrectCountry(null);
    setShowCountryInfo(false);

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
        // For capitals quiz, the question text contains the country name
        // Format: "What is the capital of {country}?"
        if (quizType === 'capitals') {
          const countryNameMatch = question.question.match(/capital of (.+)\?/);
          if (countryNameMatch && countryNameMatch[1]) {
            const countryName = countryNameMatch[1];
            setCorrectCountry({
              name: countryName,
              // The capital is the correct option text
              capital: correctOption.text
            });
            setShowCountryInfo(true);
          }
        } 
        // For flags and bollards quiz, the correct option text is the country name
        else {
          setCorrectCountry({
            name: correctOption.text,
            flagUrl: quizType === 'flags' ? question.imageUrl : undefined
          });
          setShowCountryInfo(true);
        }
      }
    }
  }, [answered, question, quizType]);

  const handleOptionClick = (option: QuizOption) => {
    if (answered) return;
    
    setAnswered(true);
    setSelectedOption(option.id);
    
    // Clear timer if it's running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    onAnswer(option.isCorrect, option.id);
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
        
        {question.imageUrl && (
          <div className="flex justify-center mb-4">
            <img 
              src={getImageUrl(question.imageUrl)} 
              alt="Quiz question" 
              className="max-h-64 object-contain rounded-md"
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option)}
            disabled={answered}
            className={`p-4 rounded-lg border border-gray-200 transition-colors duration-200 ${getOptionClass(option)}`}
          >
            {option.text}
          </button>
        ))}
      </div>
      
      {/* Next Question or View Results button */}
      {answered && (
        <div className="flex justify-center my-6 border-t border-b border-gray-100 py-6">
          <button
            onClick={onNextQuestion}
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
        <div className="mt-8 pt-4">
          <div className="mb-6 flex items-center">
            <h3 className="text-lg font-semibold text-gray-700">Country Information</h3>
            <div className="ml-auto">
              {selectedOption && question.options.find(opt => opt.id === selectedOption)?.isCorrect ? (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Correct!
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  Incorrect
                </span>
              )}
            </div>
          </div>
          <CountryInfoCard country={correctCountry} isVisible={true} />
        </div>
      )}
    </div>
  );
};

export default GenericQuizComponent; 