import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CountryInfoCard from '../CountryInfoCard';
import { getImageUrl } from '../../config/apiConfig';

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

interface CountryInfo {
  name: string;
  capital?: string;
  continent?: string;
  flagUrl?: string;
}

interface QuizComponentProps {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean, optionId: string) => void;
  timeLimit?: number; // Time limit in seconds (optional)
  onNextQuestion?: () => void; // Callback for next question button
  selectedOptionId?: string | null; // Optional selected option ID
}

const QuizComponent: React.FC<QuizComponentProps> = ({ 
  question, 
  onAnswer, 
  timeLimit,
  onNextQuestion,
  selectedOptionId: externalSelectedOptionId
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(externalSelectedOptionId || null);
  const [isAnswered, setIsAnswered] = useState(!!externalSelectedOptionId);
  const [timeLeft, setTimeLeft] = useState(timeLimit || 0);
  const [showCountryInfo, setShowCountryInfo] = useState(false);
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSubmitted = useRef(false);

  // Handle timer if timeLimit is provided
  useEffect(() => {
    if (!timeLimit || isAnswered) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          // Only auto-submit once
          if (!hasAutoSubmitted.current && !isAnswered) {
            hasAutoSubmitted.current = true;
            
            // Find the correct option for auto-submission
            const correctOption = question.options.find(opt => opt.isCorrect);
            
            // Mark as answered and call onAnswer with the selected option or empty string
            setIsAnswered(true);
            
            // Use setTimeout to avoid state updates during render
            setTimeout(() => {
              onAnswer(false, selectedOption || correctOption?.id || '');
            }, 0);
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeLimit, isAnswered, onAnswer, selectedOption, question.options]);

  // Reset component when question changes
  useEffect(() => {
    setSelectedOption(externalSelectedOptionId || null);
    setIsAnswered(!!externalSelectedOptionId);
    setTimeLeft(timeLimit || 0);
    hasAutoSubmitted.current = false;
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [question.id, timeLimit, externalSelectedOptionId]);

  const showCountryDetails = async (countryName: string) => {
    try {
      // Start with basic info we already have
      const initialCountryData: CountryInfo = {
        name: countryName,
        flagUrl: question.imageUrl
      };
      
      // Show the card immediately with what we have
      setCountryInfo(initialCountryData);
      setShowCountryInfo(true);
      
      // Then try to fetch more details from the API
      try {
        const encodedName = encodeURIComponent(countryName);
        const response = await axios.get(`/api/countries/name/${encodedName}`);
        
        if (response.data && response.data.success) {
          const { country } = response.data;
          
          // Update with complete information - pass the entire country object
          setCountryInfo({
            ...country,
            flagUrl: country.flagUrl || question.imageUrl
          });
        }
      } catch (error) {
        console.log('Could not fetch additional country details, using basic info');
        // We already showed the basic info, so no need to handle this error
      }
    } catch (error) {
      console.error('Error showing country details:', error);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return; // Prevent changing answer after submission
    
    // Set the selected option
    setSelectedOption(optionId);
    
    // Immediately submit the answer
    const selectedOptionObj = question.options.find(opt => opt.id === optionId);
    const isCorrect = selectedOptionObj?.isCorrect || false;
    
    setIsAnswered(true);
    onAnswer(isCorrect, optionId);
    
    // If the answer is correct, show country info
    if (isCorrect) {
      const correctOption = question.options.find(opt => opt.isCorrect);
      if (correctOption) {
        showCountryDetails(correctOption.text);
      }
    }
  };

  const handleNextQuestion = () => {
    // Hide country info when moving to next question
    setShowCountryInfo(false);
    setCountryInfo(null);
    
    if (onNextQuestion) {
      onNextQuestion();
    }
  };
  


  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{question.question}</h2>
        
        {timeLimit && !isAnswered && (
          <div className="text-sm text-gray-600 mb-2">
            Time remaining: {timeLeft} seconds
          </div>
        )}
        
        {question.imageUrl && (
          <div className="mb-4 h-[400px] flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">
            <img 
              src={getImageUrl(question.imageUrl)} 
              alt="Quiz visual" 
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}
      </div>
      
      <div className="space-y-3 mb-6">
        {question.options.map(option => (
          <button
            key={option.id}
            onClick={() => handleOptionSelect(option.id)}
            className={`w-full text-left p-3 rounded-md border transition-colors ${
              selectedOption === option.id
                ? isAnswered
                  ? option.isCorrect
                    ? 'bg-green-100 border-green-500'
                    : 'bg-red-100 border-red-500'
                  : 'bg-blue-100 border-blue-500'
                : isAnswered && option.isCorrect
                  ? 'bg-green-100 border-green-500'
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
            }`}
            disabled={isAnswered}
          >
            <div className="flex items-center">
              <span className="flex-grow">{option.text}</span>
              {isAnswered && option.isCorrect && (
                <span className="text-green-600 ml-2">✓</span>
              )}
              {isAnswered && selectedOption === option.id && !option.isCorrect && (
                <span className="text-red-600 ml-2">✗</span>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <div className="flex justify-between">
        {isAnswered && (
          <button
            onClick={handleNextQuestion}
            className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Next Question
          </button>
        )}
      </div>
      
      {countryInfo && (
        <CountryInfoCard 
          country={countryInfo}
          isVisible={showCountryInfo}
        />
      )}
    </div>
  );
};

export default QuizComponent;
