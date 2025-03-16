import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Country {
  id: string;
  name: string;
}

interface WriteAnswerInputProps {
  onSubmit: (isCorrect: boolean, countryName: string) => void;
  correctAnswers: string[];
  disabled: boolean;
}

const WriteAnswerInput: React.FC<WriteAnswerInputProps> = ({ 
  onSubmit, 
  correctAnswers,
  disabled 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch all countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('/api/countries');
        if (response.data?.success && response.data.countries) {
          setCountries(response.data.countries);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);

  // Filter countries based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredCountries([]);
      return;
    }

    const filtered = countries.filter(country => 
      country.name.toLowerCase().includes(inputValue.toLowerCase())
    );
    
    // Sort filtered countries to show those that start with the input first
    filtered.sort((a, b) => {
      const aStartsWith = a.name.toLowerCase().startsWith(inputValue.toLowerCase());
      const bStartsWith = b.name.toLowerCase().startsWith(inputValue.toLowerCase());
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return a.name.localeCompare(b.name);
    });
    
    setFilteredCountries(filtered.slice(0, 5)); // Limit to 5 suggestions
  }, [inputValue, countries]);

  // Handle clicks outside the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (countryName: string) => {
    setInputValue(countryName);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (disabled || !inputValue.trim()) return;
    
    // Debug logging for input validation
    if (process.env.NODE_ENV !== 'production') {
      console.log('Write mode validation:', {
        inputValue,
        correctAnswers,
        inputLower: inputValue.toLowerCase(),
        correctLower: correctAnswers.map(a => a.toLowerCase())
      });
    }
    
    // Check if the entered country name is correct (case-insensitive)
    const isCorrect = correctAnswers.some(
      country => country.toLowerCase() === inputValue.toLowerCase()
    );
    
    // Debug check result
    if (process.env.NODE_ENV !== 'production') {
      console.log('Answer correctness:', {
        isCorrect,
        matches: correctAnswers.filter(c => c.toLowerCase() === inputValue.toLowerCase())
      });
    }
    
    onSubmit(isCorrect, inputValue);
  };

  return (
    <div className="relative w-full mb-4">
      <div className="flex">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Type a country name..."
          className="w-full p-3 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !inputValue.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Submit
        </button>
      </div>
      
      {showSuggestions && filteredCountries.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full bg-white mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredCountries.map(country => (
            <div
              key={country.id}
              className="p-2 hover:bg-blue-100 cursor-pointer"
              onClick={() => handleSuggestionClick(country.name)}
            >
              {country.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WriteAnswerInput; 