import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { QuizType } from '../types/quiz';
import { QUIZ_CONFIGS } from '../config/quizConfig';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getSettings, saveSettings, QuizSettings as StoredQuizSettings } from '../utils/settingsStorage';
import Tooltip from '../components/Tooltip';

interface QuizSettingsPageProps {}

const QuizSettingsPage: React.FC<QuizSettingsPageProps> = () => {
  const navigate = useNavigate();
  const { quizType } = useParams<{ quizType: string }>();
  
  // Get quiz config early for setting initial values
  const quizConfig = quizType && QUIZ_CONFIGS[quizType as QuizType];
  
  // Replace refs with a loading state
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  
  // Initialize state with empty/default values first
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [onlyGeoGuessr, setOnlyGeoGuessr] = useState<boolean>(false);
  const [writeMode, setWriteMode] = useState<boolean>(false);
  const [blurred, setBlurred] = useState<boolean>(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [continents, setContinents] = useState<string[]>([
    'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica'
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Initial values don't matter as they'll be immediately replaced
  const [timerEnabled, setTimerEnabled] = useState<boolean>(true);
  const [timerDuration, setTimerDuration] = useState<number>(30);
  const [questionCount, setQuestionCount] = useState<number>(10);
  
  // New state for max question count
  const [maxQuestionCount, setMaxQuestionCount] = useState<number>(50);
  
  // Set the document title for the quiz settings page
  useDocumentTitle(quizConfig ? `${quizConfig.title} Settings` : 'Quiz Settings', true);
  
  // Function to load settings from localStorage
  const loadSettingsFromStorage = useCallback(() => {
    // Keep only quizType check
    if (!quizType) return;
    
    if (settingsLoaded) return;
    
    if (quizType === 'flags' || quizType === 'capitals' || 
        quizType === 'bollards' || quizType === 'licenseplates' ||
        quizType === 'roadsigns') {
      console.log(`Loading settings from localStorage for ${quizType}...`);
      
      try {
        const savedSettings = getSettings(quizType as QuizType);
        console.log('Loaded settings:', savedSettings);
        
        // Apply saved settings to state
        setTimerEnabled(savedSettings.timerEnabled);
        setTimerDuration(savedSettings.timerDuration);
        setQuestionCount(savedSettings.questionCount);
        setWriteMode(savedSettings.writeMode || false);
        setSelectedContinent(savedSettings.continent || 'all');
        setOnlyGeoGuessr(savedSettings.in_geoguessr || false);
        setBlurred(savedSettings.blurred || false);
        setSelectedTypes(savedSettings.types || []);
        
        // Mark initial load as complete using state
        setSettingsLoaded(true);
        console.log('Settings loaded successfully');
      } catch (error) {
        console.error('Error loading settings:', error);
        // If loading fails, use quiz config defaults
        if (quizConfig) {
          setTimerEnabled(true);
          setTimerDuration(quizConfig.timeLimit);
          setQuestionCount(quizConfig.questionsPerQuiz);
        }
        // Also mark as loaded even if defaults are used
        setSettingsLoaded(true); 
      }
    }
  }, [quizType, quizConfig, settingsLoaded]);
  
  // Load saved settings from localStorage immediately on mount and quiz type changes
  useEffect(() => {
    loadSettingsFromStorage();
  }, [loadSettingsFromStorage]);
  
  // Save settings whenever they change, but only after initial load is complete
  useEffect(() => {
    // Use settingsLoaded state for guard
    if (!settingsLoaded) {
      return;
    }
    
    if (quizType && (quizType === 'flags' || quizType === 'capitals' || 
                     quizType === 'bollards' || quizType === 'licenseplates' ||
                     quizType === 'roadsigns')) {
      console.log('Saving settings to localStorage...');
      
      const currentSettings: StoredQuizSettings = {
        timerEnabled,
        timerDuration,
        questionCount,
        writeMode,
        continent: selectedContinent,
        in_geoguessr: onlyGeoGuessr,
        blurred,
        types: selectedTypes
      };
      
      saveSettings(quizType as QuizType, currentSettings);
      console.log('Settings saved:', currentSettings);
    }
    // Add settingsLoaded to dependencies
  }, [quizType, timerEnabled, timerDuration, questionCount, writeMode, selectedContinent, onlyGeoGuessr, blurred, selectedTypes, settingsLoaded]);
  
  // Fetch continents on component mount
  useEffect(() => {
    const fetchContinents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/countries/continents');
        if (response.data && response.data.length > 0) {
          setContinents(response.data);
        }
      } catch (error) {
        console.error('Error fetching continents:', error);
        // Keep using the default continents defined in state
      } finally {
        setLoading(false);
      }
    };
    
    fetchContinents();
  }, []);
  
  // Fetch max question count when filters or quiz type changes
  useEffect(() => {
    const fetchMaxQuestionCount = async () => {
      if (!quizType) return;
      
      try {
        setLoading(true);
        
        let endpoint = '';
        if (quizType === 'flags' || quizType === 'capitals') {
          endpoint = '/api/countries/count';
        } else if (quizType === 'bollards') {
          endpoint = '/api/bollards/count';
        } else if (quizType === 'licenseplates') {
          endpoint = '/api/licenseplates/count';
        } else if (quizType === 'roadsigns') {
          endpoint = '/api/roadsigns/count';
        }
        
        if (endpoint) {
          const params: any = {};
          
          // Apply continent filter for all quiz types
          if (selectedContinent !== 'all') {
            params.continent = selectedContinent;
          }
          
          if (onlyGeoGuessr) {
            params.in_geoguessr = true;
          }
          
          // Add selected types filter for road signs
          if (quizType === 'roadsigns' && selectedTypes.length > 0) {
            params.types = selectedTypes.join(',');
          }
          
          const response = await axios.get(endpoint, { params });
          
          if (response.data && response.data.success) {
            // Be explicit about handling a count of 0
            const count = response.data.count;
            const newMaxCount = count !== undefined ? count : 50;
            setMaxQuestionCount(newMaxCount);
            
            // Check if we need to adjust the question count
            if (newMaxCount === 0) {
              // If no questions available, set to 1 (it will be disabled)
              setQuestionCount(1);
            } else if (questionCount > newMaxCount) {
              // Only adjust if current value exceeds max
              console.log(`Reducing question count from ${questionCount} to ${newMaxCount} due to filter constraints`);
              setQuestionCount(newMaxCount);
            }

            // Log available questions after settings load
            console.log(`Available questions: ${newMaxCount}, current question count: ${questionCount}`);
          }
        }
      } catch (error) {
        console.error(`Error fetching max question count for ${quizType}:`, error);
        // Default to 50 if there's an error
        setMaxQuestionCount(50);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch max question count after localStorage settings are loaded
    // to avoid overwriting the loaded settings
    if (settingsLoaded && quizType) {
      fetchMaxQuestionCount();
    }
  }, [quizType, selectedContinent, onlyGeoGuessr, selectedTypes, settingsLoaded, questionCount]);
  
  // Helper function to handle type checkbox changes
  const handleTypeCheckboxChange = (type: string, checked: boolean) => {
    setSelectedTypes(prev => {
      if (checked) {
        // Add type if not already present
        return prev.includes(type) ? prev : [...prev, type];
      }
      // Remove type
      return prev.filter(t => t !== type);
    });
  };
  
  const handleStartQuiz = () => {
    // Initialize a new quiz session with filters and settings
    navigate(`/quiz/${quizType}`, { 
      state: { 
        filters: {
          continent: selectedContinent,
          in_geoguessr: onlyGeoGuessr,  // Using snake_case to match server convention
          types: quizType === 'roadsigns' ? selectedTypes : undefined
        },
        settings: {
          timerEnabled,
          timerDuration,
          questionCount,
          writeMode,
          blurred,
          blurIntensity: 15 // Default value
        }
      }
    });
  };
  
  if (!quizConfig) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Quiz Not Found</h1>
          <p className="text-gray-500 mb-6">The requested quiz type does not exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">
          {quizConfig.type === 'capitals' ? '🏙️' : 
           quizConfig.type === 'flags' ? '🏳️' : 
           quizConfig.type === 'bollards' ? '🚧' : 
           quizConfig.type === 'licenseplates' ? '🚗' : 
           quizConfig.type === 'roadsigns' ? '🚦' : '❓'}
        </div>
        <h1 className="text-3xl font-bold mb-1">{quizConfig.title}</h1>
        <p className="text-gray-600">{quizConfig.description}</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        
        {/* General Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Filters</h2>
          
          {/* Continent Select */}
          <div className="mb-4">
            <label htmlFor="continent-select" className="block text-sm font-medium text-gray-700 mb-1">Continent</label>
            <select
              id="continent-select"
              value={selectedContinent}
              onChange={(e) => setSelectedContinent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Continents</option>
              {continents.map((continent) => (
                <option key={continent} value={continent}>
                  {continent}
                </option>
              ))}
            </select>
          </div>

          {/* GeoGuessr Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="geoguessr-toggle"
              checked={onlyGeoGuessr}
              onChange={(e) => setOnlyGeoGuessr(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="geoguessr-toggle" className="ml-2 block text-sm font-medium text-gray-700">
              Only GeoGuessr countries
            </label>
            <Tooltip text="Limit questions to countries available in GeoGuessr." />
          </div>
        </div>

        {/* Gameplay Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Gameplay</h2>

          {/* Write Mode Setting - Conditionally rendered */}
          {quizConfig.type !== 'capitals' && (
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="write-mode-toggle"
                checked={writeMode}
                onChange={(e) => setWriteMode(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="write-mode-toggle" className="ml-2 block text-sm font-medium text-gray-700">
                Enable Write Mode
              </label>
              <Tooltip text="Type the answer instead of selecting from choices." />
            </div>
          )}

          {/* Blurred Mode Setting - Only for license plates */}
          {quizConfig.type === 'licenseplates' && (
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="blurred-toggle"
                checked={blurred}
                onChange={(e) => setBlurred(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="blurred-toggle" className="ml-2 block text-sm font-medium text-gray-700">
                Blurred Image
              </label>
               <Tooltip text="Blur the license plate image for an extra challenge." />
            </div>
          )}

          {/* Timer Settings */}
          <div className="mb-4">
             <div className="flex items-center mb-2">
               <input
                 type="checkbox"
                 id="timer-toggle"
                 checked={timerEnabled}
                 onChange={(e) => setTimerEnabled(e.target.checked)}
                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
               />
               <label htmlFor="timer-toggle" className="ml-2 block text-sm font-medium text-gray-700">
                 Enable Timer
               </label>
             </div>
            
             {timerEnabled && (
               <div className="ml-6">
                 <label htmlFor="timer-duration" className="block text-xs font-medium text-gray-600 mb-1">
                   Time per question (5-120s)
                 </label>
                 <input
                   type="number"
                   id="timer-duration"
                   min="5"
                   max="120"
                   value={timerDuration}
                   onChange={(e) => setTimerDuration(Math.max(5, Math.min(120, parseInt(e.target.value) || 30)))}
                   className="w-20 p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                 />
               </div>
             )}
           </div>
           
          {/* Question Count Settings */}
          <div>
             <label htmlFor="question-count" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions {maxQuestionCount > 0 ? `(1-${maxQuestionCount})` : ''}
              </label>
             <div className="flex items-center">
               <input
                 type="number"
                 id="question-count"
                 min="1"
                 max={maxQuestionCount || 1}
                 value={questionCount}
                 onChange={(e) => setQuestionCount(Math.max(1, Math.min(maxQuestionCount || 1, parseInt(e.target.value) || 10)))}
                 className="w-20 p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                 disabled={maxQuestionCount === 0}
               />
               {/* <span className="ml-2 text-sm text-gray-600">questions</span> */}
              {loading && (
                <span className="ml-3 text-sm text-blue-500">
                  Loading...
                </span>
              )}
             </div>
             {maxQuestionCount === 0 && !loading && (
               <p className="mt-1 text-xs text-red-500 font-medium">
                 No questions available with current filters.
               </p>
             )}
          </div>
        </div>

        {/* Sign Type Section - Only for road signs */}
        {quizConfig.type === 'roadsigns' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Sign Types</h2>
            <p className="text-xs text-gray-500 mb-3">
              Select specific sign types to include. If none are selected, all types are included.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-3">
              {[
                { id: 'pedestrian', label: '🚶 Pedestrian', description: 'Signs related to pedestrian crossings or paths.' },
                { id: 'stop', label: '🛑 Stop', description: 'Standard octagonal stop signs.' },
                { id: 'chevrons', label: '❯❯ Chevrons', description: 'Signs indicating sharp turns or curves.' },
                { id: 'back', label: '🔙 Back of Sign', description: 'The reverse side of various road signs.' },
                { id: 'yield', label: '▽ Yield', description: 'Inverted triangle signs indicating yield/give way.' },
                { id: 'direction', label: '↕️ Direction', description: 'Signs showing directions or navigational guidance.' },
                { id: 'street', label: '🏙️ Street', description: 'Street name signs and markers.' },
                // Add more types here if needed
              ].map((signType) => (
                <div key={signType.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`${signType.id}-toggle`}
                    checked={selectedTypes.includes(signType.id)}
                    onChange={(e) => handleTypeCheckboxChange(signType.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`${signType.id}-toggle`} className="ml-2 block text-sm font-medium text-gray-700">
                    {signType.label}
                  </label>
                  <Tooltip text={signType.description} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            Back to Home
          </button>
          
          <button
            onClick={handleStartQuiz}
            disabled={maxQuestionCount === 0 || loading} // Disable while loading too
            className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition duration-150 ease-in-out ${
              (maxQuestionCount === 0 || loading)
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Loading...' : maxQuestionCount === 0 ? 'No Questions' : 'Start Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizSettingsPage;
