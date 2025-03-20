import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface QuizCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  supportsFilters?: boolean;
}

const HomePage: React.FC = () => {
  // Set the document title for the home page
  useDocumentTitle('Home', true);
  
  const navigate = useNavigate();
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [onlyGeoGuessr, setOnlyGeoGuessr] = useState<boolean>(false);
  const [continents, setContinents] = useState<string[]>([
    'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica'
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Quiz categories
  const categories: QuizCategory[] = [
    { id: 'capitals', name: 'Capitals', description: 'Match capitals to their countries', icon: '🏙️', supportsFilters: true },
    { id: 'flags', name: 'Flags', description: 'Test your knowledge of country flags', icon: '🏳️', supportsFilters: true },
    { id: 'bollards', name: 'Bollards', description: 'Identify countries by their road bollards', icon: '🚧', supportsFilters: true },
    { id: 'licenseplates', name: 'License Plates', description: 'Recognize license plates from around the world', icon: '🚗', supportsFilters: true },
    { id: 'road_signs', name: 'Road Signs', description: 'Learn to identify road signs by country', icon: '🚸' },
  ];
  
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
  
  const handleStartQuiz = (categoryId: string) => {
    // Navigate to the quiz settings page for quizzes that support filters
    const category = categories.find(c => c.id === categoryId);
    
    if (category?.supportsFilters) {
      console.log(`Starting ${categoryId} quiz - navigating to settings`);
      navigate(`/quiz/${categoryId}/settings`);
    } else {
      // Standard navigation for other quiz types
      navigate(`/quiz/${categoryId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="py-6 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center text-gray-800">GeoTrainer</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-10">
        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="flex flex-col bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col items-center">
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-center">{category.name}</h3>
                <p className="text-gray-500 text-sm text-center mb-4">{category.description}</p>
              </div>
              
              {/* Start button */}
              <button
                onClick={() => handleStartQuiz(category.id)}
                className="mt-auto w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Start Quiz
              </button>
            </div>
          ))}
        </div>

        {/* Release Notes Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-10">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Release Notes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completed Features */}
            <div className="border-t-4 border-green-500 rounded-lg p-4 bg-green-50">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="text-green-600 mr-2">✓</span> Completed Features
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Capital Cities Quiz with multiple choice options</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Country Flags Quiz with multiple choice and write mode</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Bollards Quiz for identifying street poles</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Continent filters for all quizzes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>GeoGuessr-only country mode</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Customizable timer and question count</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Detailed quiz results and statistics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Shareable quiz results via unique quiz ID</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Learning pages for each quiz category</span>
                </li>
              </ul>
            </div>
            
            {/* In Progress Features */}
            <div className="border-t-4 border-yellow-500 rounded-lg p-4 bg-yellow-50">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="text-yellow-600 mr-2">⟳</span> In Progress
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>License Plates Quiz (uploading more data)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>Road Signs Quiz (coming soon)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>Performance optimizations for faster loading</span>
                </li>
              </ul>
            </div>
            
            {/* Planned Features */}
            <div className="border-t-4 border-blue-500 rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="text-blue-600 mr-2">○</span> Planned Features
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Cars Quiz for vehicle identification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Domain quiz</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>US License Plates regional quiz</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Phone Prefixes quiz for country codes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>User accounts with progress tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Adaptive quizzes based on your performance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Quiz history and progress tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Blurred plates quiz</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>And more...</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p className="mt-2">
              Join the discussion on <a href="https://www.reddit.com/r/geoguessr/comments/1jcm67f/yet_another_bollard_and_more_quiz_test_it_if_you/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Reddit</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
