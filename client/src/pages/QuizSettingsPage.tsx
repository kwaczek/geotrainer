import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { QuizType } from '../types/quiz';
import { QUIZ_CONFIGS } from '../config/quizConfig';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getSettings, saveSettings, QuizSettings as StoredQuizSettings } from '../utils/settingsStorage';

interface QuizSettingsPageProps {}

const QuizSettingsPage: React.FC<QuizSettingsPageProps> = () => {
  const navigate = useNavigate();
  const { quizType } = useParams<{ quizType: string }>();
  
  // Get quiz config early for setting initial values
  const quizConfig = quizType && QUIZ_CONFIGS[quizType as QuizType];
  
  // Add a ref to track if settings are being loaded from localStorage
  const initialLoadCompleted = useRef<boolean>(false);
  const initialLoadStarted = useRef<boolean>(false);
  
  // Initialize state with empty/default values first
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [onlyGeoGuessr, setOnlyGeoGuessr] = useState<boolean>(false);
  const [writeMode, setWriteMode] = useState<boolean>(false);
  const [blurred, setBlurred] = useState<boolean>(false);
  const [pedestrianSigns, setPedestrianSigns] = useState<boolean>(false);
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
    if (!quizType || initialLoadStarted.current) return;
    
    initialLoadStarted.current = true;
    
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
        setPedestrianSigns(savedSettings.pedestrianSigns || false);
        
        // Mark initial load as complete
        initialLoadCompleted.current = true;
        console.log('Settings loaded successfully');
      } catch (error) {
        console.error('Error loading settings:', error);
        // If loading fails, use quiz config defaults
        if (quizConfig) {
          setTimerEnabled(true);
          setTimerDuration(quizConfig.timeLimit);
          setQuestionCount(quizConfig.questionsPerQuiz);
        }
      }
    }
  }, [quizType, quizConfig]);
  
  // Load saved settings from localStorage immediately on mount and quiz type changes
  useEffect(() => {
    loadSettingsFromStorage();
  }, [loadSettingsFromStorage]);
  
  // Save settings whenever they change, but only after initial load is complete
  useEffect(() => {
    // Skip saving during the initial load from localStorage
    if (!initialLoadCompleted.current) {
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
        pedestrianSigns
      };
      
      saveSettings(quizType as QuizType, currentSettings);
      console.log('Settings saved:', currentSettings);
    }
  }, [quizType, timerEnabled, timerDuration, questionCount, writeMode, selectedContinent, onlyGeoGuessr, blurred, pedestrianSigns]);
  
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
          
          // Add pedestrian signs filter for road signs
          if (quizType === 'roadsigns' && pedestrianSigns) {
            params.pedestrian = true;
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
    if (initialLoadCompleted.current || initialLoadStarted.current) {
      fetchMaxQuestionCount();
    }
  }, [quizType, selectedContinent, onlyGeoGuessr, pedestrianSigns, questionCount]);
  
  const handleStartQuiz = () => {
    // Initialize a new quiz session with filters and settings
    navigate(`/quiz/${quizType}`, { 
      state: { 
        filters: {
          continent: selectedContinent,
          in_geoguessr: onlyGeoGuessr,  // Using snake_case to match server convention
          pedestrian: quizType === 'roadsigns' ? pedestrianSigns : undefined
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
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2 text-center">Quiz Not Found</h1>
          <p className="text-gray-500 text-center">The requested quiz type does not exist.</p>
          <div className="flex justify-center mt-6">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col items-center mb-6">
          <div className="text-5xl mb-4">
            {quizConfig.type === 'capitals' ? '🏙️' : 
             quizConfig.type === 'flags' ? '🏳️' : 
             quizConfig.type === 'bollards' ? '🚧' : 
             quizConfig.type === 'licenseplates' ? '🚗' : '❓'}
          </div>
          <h1 className="text-2xl font-bold mb-2 text-center">{quizConfig.title}</h1>
          <p className="text-gray-500 text-center">{quizConfig.description}</p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quiz Settings</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Continent</label>
            <select
              value={selectedContinent}
              onChange={(e) => setSelectedContinent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Continents</option>
              {continents.map((continent) => (
                <option key={continent} value={continent}>
                  {continent}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Select a continent to focus on, or choose "All Continents"
            </p>
          </div>
          
          <div className="mb-6">
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
            </div>
            <p className="mt-1 ml-6 text-sm text-gray-500">
              Limit questions to countries that appear in the GeoGuessr game
            </p>
          </div>
          
          {/* Write Mode Setting - Only for non-capitals quizzes */}
          {quizConfig.type !== 'capitals' && (
            <div className="mb-6">
              <div className="flex items-center">
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
              </div>
              <p className="mt-1 ml-6 text-sm text-gray-500">
                Type the country name instead of selecting from multiple choice options
              </p>
            </div>
          )}
          
          {/* Blurred Mode Setting - Only for license plates quiz */}
          {quizConfig.type === 'licenseplates' && (
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="blurred-toggle"
                  checked={blurred}
                  onChange={(e) => setBlurred(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="blurred-toggle" className="ml-2 block text-sm font-medium text-gray-700">
                  Blurred
                </label>
              </div>
            </div>
          )}
          
          {/* Sign Type Section - Only for road signs quiz */}
          {quizConfig.type === 'roadsigns' && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Sign Type</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pedestrian-signs-toggle"
                  checked={pedestrianSigns}
                  onChange={(e) => setPedestrianSigns(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="pedestrian-signs-toggle" className="ml-2 block text-sm font-medium text-gray-700">
                  Pedestrian Signs
                </label>
              </div>
              <p className="mt-1 ml-6 text-sm text-gray-500">
                Only show pedestrian-related road signs
              </p>
            </div>
          )}
          
          {/* Timer Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Timer Settings</h3>
            
            <div className="flex items-center mb-3">
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
                <label htmlFor="timer-duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Time per question (seconds)
                </label>
                <input
                  type="number"
                  id="timer-duration"
                  min="5"
                  max="120"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(Math.max(5, Math.min(120, parseInt(e.target.value) || 30)))}
                  className="w-24 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Choose between 5-120 seconds per question
                </p>
              </div>
            )}
          </div>
          
          {/* Question Count Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Number of Questions</h3>
            <div className="flex items-center">
              <input
                type="number"
                id="question-count"
                min="1"
                max={maxQuestionCount || 1}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, Math.min(maxQuestionCount || 1, parseInt(e.target.value) || 10)))}
                className="w-24 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={maxQuestionCount === 0}
              />
              <label htmlFor="question-count" className="ml-2 block text-sm font-medium text-gray-700">
                questions
              </label>
            </div>
            {maxQuestionCount > 0 ? (
              <p className="mt-1 text-sm text-gray-500">
                Choose between 1-{maxQuestionCount} questions per quiz
              </p>
            ) : (
              <p className="mt-1 text-sm text-red-500 font-medium">
                No questions available with current filter settings. Try changing continent or GeoGuessr filter.
              </p>
            )}
            {loading && (
              <p className="mt-1 text-sm text-blue-500">
                Loading available questions...
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Home
          </button>
          
          <button
            onClick={handleStartQuiz}
            disabled={maxQuestionCount === 0}
            className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              maxQuestionCount === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {maxQuestionCount === 0 ? 'No questions available' : 'Start Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizSettingsPage;
