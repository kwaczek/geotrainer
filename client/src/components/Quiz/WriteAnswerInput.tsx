import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import axios from 'axios';

interface Country {
  id: string;
  name: string;
}

interface WriteAnswerInputProps {
  onSubmit: (isCorrect: boolean, countryName: string) => void;
  correctAnswers: string[];
  disabled: boolean;
  onAfterSubmit?: () => void;
}

const WriteAnswerInput: React.FC<WriteAnswerInputProps> = ({ 
  onSubmit, 
  correctAnswers,
  disabled,
  onAfterSubmit 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const suggestionItemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-focus input field when component mounts and not disabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

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
      setSelectedIndex(-1);
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
    
    // Reset selected index when filtered countries change
    setSelectedIndex(-1);
    
    // Initialize refs array for the new filtered countries
    suggestionItemsRef.current = Array(Math.min(filtered.length, 5)).fill(null);
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
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSelectSuggestion = (index: number) => {
    if (index >= 0 && index < filteredCountries.length) {
      handleSuggestionClick(filteredCountries[index].name);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle keyboard navigation for the dropdown
    if (showSuggestions && filteredCountries.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault(); // Prevent cursor from moving
          setSelectedIndex((prevIndex) => 
            prevIndex < filteredCountries.length - 1 ? prevIndex + 1 : prevIndex
          );
          break;
          
        case 'ArrowUp':
          e.preventDefault(); // Prevent cursor from moving
          setSelectedIndex((prevIndex) => 
            prevIndex > 0 ? prevIndex - 1 : prevIndex
          );
          break;
          
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            // If an item is selected in the dropdown, use it
            handleSelectSuggestion(selectedIndex);
          } else {
            // Otherwise submit the form
            handleSubmit();
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
          
        case 'Tab':
          // If an item is selected, use it before tabbing away
          if (selectedIndex >= 0) {
            handleSelectSuggestion(selectedIndex);
          }
          setShowSuggestions(false);
          break;
          
        default:
          break;
      }
    } else if (e.key === 'Enter') {
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
    
    // Call the onAfterSubmit callback to focus the next element
    setTimeout(() => {
      if (onAfterSubmit) {
        onAfterSubmit();
      }
    }, 0);
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
          aria-autocomplete="list"
          aria-controls={showSuggestions ? "country-suggestions" : undefined}
          aria-expanded={showSuggestions}
          aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
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
          id="country-suggestions"
          role="listbox"
          className="absolute z-10 w-full bg-white mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredCountries.map((country, index) => (
            <div
              ref={(el) => {
                suggestionItemsRef.current[index] = el;
              }}
              key={country.id}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={selectedIndex === index}
              className={`p-2 cursor-pointer ${
                selectedIndex === index 
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSuggestionClick(country.name)}
              onMouseEnter={() => setSelectedIndex(index)}
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