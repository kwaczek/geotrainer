import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { QuizType } from '../types/quiz';
import { QUIZ_CONFIGS } from '../config/quizConfig';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface QuizSettingsPageProps {}

const QuizSettingsPage: React.FC<QuizSettingsPageProps> = () => {
  const navigate = useNavigate();
  const { quizType } = useParams<{ quizType: string }>();
  
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [onlyGeoGuessr, setOnlyGeoGuessr] = useState<boolean>(false);
  const [continents, setContinents] = useState<string[]>([
    'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica'
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // New state for timer and question count settings
  const [timerEnabled, setTimerEnabled] = useState<boolean>(true);
  const [timerDuration, setTimerDuration] = useState<number>(30);
  const [questionCount, setQuestionCount] = useState<number>(10);
  
  // Get quiz config
  const quizConfig = quizType && QUIZ_CONFIGS[quizType as QuizType];
  
  // Set the document title for the quiz settings page
  useDocumentTitle(quizConfig ? `${quizConfig.title} Settings` : 'Quiz Settings', true);
  
  // Initialize timer and question count from quiz config
  useEffect(() => {
    if (quizConfig) {
      setTimerDuration(quizConfig.timeLimit);
      setQuestionCount(quizConfig.questionsPerQuiz);
    }
  }, [quizConfig]);
  
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
  
  const handleStartQuiz = () => {
    // Initialize a new quiz session with filters and settings
    navigate(`/quiz/${quizType}`, { 
      state: { 
        filters: {
          continent: selectedContinent,
          in_geoguessr: onlyGeoGuessr  // Using snake_case to match server convention
        },
        settings: {
          timerEnabled,
          timerDuration,
          questionCount
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
                min="5"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(5, Math.min(50, parseInt(e.target.value) || 10)))}
                className="w-24 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <label htmlFor="question-count" className="ml-2 block text-sm font-medium text-gray-700">
                questions
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Choose between 5-50 questions per quiz
            </p>
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
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizSettingsPage;
