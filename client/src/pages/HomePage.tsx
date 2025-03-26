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

interface QuizCounts {
  countries: number;
  bollards: number;
  licenseplates: number;
  roadsigns: number;
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
  const [quizCounts, setQuizCounts] = useState<QuizCounts>({
    countries: 0,
    bollards: 0,
    licenseplates: 0,
    roadsigns: 0
  });
  
  // Quiz categories
  const categories: QuizCategory[] = [
    { id: 'capitals', name: 'Capitals', description: 'Match capitals to their countries', icon: '🏙️', supportsFilters: true },
    { id: 'flags', name: 'Flags', description: 'Test your knowledge of country flags', icon: '🏳️', supportsFilters: true },
    { id: 'bollards', name: 'Bollards', description: 'Identify countries by their road bollards', icon: '🚧', supportsFilters: true },
    { id: 'licenseplates', name: 'License Plates', description: 'Recognize license plates from around the world', icon: '🚗', supportsFilters: true },
    { id: 'roadsigns', name: 'Road Signs', description: 'Learn to identify road signs by country', icon: '🚸', supportsFilters: true },
  ];
  
  // Fetch continents and quiz counts on component mount
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
    
    const fetchQuizCounts = async () => {
      try {
        const [countriesRes, bollardsRes, licenseplatesRes, roadsignsRes] = await Promise.all([
          axios.get('/api/countries/count'),
          axios.get('/api/bollards/count'),
          axios.get('/api/licenseplates/count'),
          axios.get('/api/roadsigns/count')
        ]);
        
        setQuizCounts({
          countries: countriesRes.data.success ? countriesRes.data.count : 0,
          bollards: bollardsRes.data.success ? bollardsRes.data.count : 0,
          licenseplates: licenseplatesRes.data.success ? licenseplatesRes.data.count : 0,
          roadsigns: roadsignsRes.data.success ? roadsignsRes.data.count : 0
        });
      } catch (error) {
        console.error('Error fetching quiz counts:', error);
      }
    };
    
    fetchContinents();
    fetchQuizCounts();
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

  // Helper function to get the count for a category
  const getCategoryCount = (categoryId: string): number => {
    if (categoryId === 'flags' || categoryId === 'capitals') {
      return quizCounts.countries;
    } else if (categoryId === 'bollards') {
      return quizCounts.bollards;
    } else if (categoryId === 'licenseplates') {
      return quizCounts.licenseplates;
    } else if (categoryId === 'roadsigns') {
      return quizCounts.roadsigns;
    }
    return 0;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {categories.map((category) => {
            // Define category-specific colors
            let bgGradient, iconBg, buttonBg, buttonHover;
            
            switch(category.id) {
              case 'capitals':
                bgGradient = 'from-blue-50 to-blue-100';
                iconBg = 'bg-blue-100';
                buttonBg = 'bg-blue-500';
                buttonHover = 'hover:bg-blue-600';
                break;
              case 'flags':
                bgGradient = 'from-red-50 to-red-100';
                iconBg = 'bg-red-100';
                buttonBg = 'bg-red-500';
                buttonHover = 'hover:bg-red-600';
                break;
              case 'bollards':
                bgGradient = 'from-yellow-50 to-yellow-100';
                iconBg = 'bg-yellow-100';
                buttonBg = 'bg-yellow-500';
                buttonHover = 'hover:bg-yellow-600';
                break;
              case 'licenseplates':
                bgGradient = 'from-green-50 to-green-100';
                iconBg = 'bg-green-100';
                buttonBg = 'bg-green-500';
                buttonHover = 'hover:bg-green-600';
                break;
              case 'roadsigns':
                bgGradient = 'from-purple-50 to-purple-100';
                iconBg = 'bg-purple-100';
                buttonBg = 'bg-purple-500';
                buttonHover = 'hover:bg-purple-600';
                break;
              default:
                bgGradient = 'from-gray-50 to-gray-100';
                iconBg = 'bg-gray-100';
                buttonBg = 'bg-blue-500';
                buttonHover = 'hover:bg-blue-600';
            }
            
            return (
              <div 
                key={category.id} 
                className={`flex flex-col bg-gradient-to-br ${bgGradient} p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 transform hover:-translate-y-1`}
              >
                <div className="flex flex-col items-center">
                  <div className={`text-4xl mb-3 ${iconBg} p-4 rounded-full shadow-sm`}>{category.icon}</div>
                  <h3 className="text-lg font-semibold mb-1 text-center">{category.name}</h3>
                  <p className="text-gray-600 text-xs text-center mb-3">{category.description}</p>
                  
                  {/* Display count badge for quizzes with available counts */}
                  {category.supportsFilters && (
                    <div className="bg-white bg-opacity-70 text-gray-700 text-xs font-medium px-3 py-1 rounded-full mb-3 shadow-sm border border-gray-200">
                      {loading ? (
                        <span>Loading...</span>
                      ) : (
                        <span>
                          {getCategoryCount(category.id)} {category.id === 'capitals' || category.id === 'flags' 
                            ? 'countries' 
                            : category.id === 'bollards' 
                              ? 'bollards' 
                              : category.id === 'licenseplates' 
                                ? 'license plates' 
                                : 'road signs'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Start button */}
                <button
                  onClick={() => handleStartQuiz(category.id)}
                  className={`mt-auto w-full py-2 ${buttonBg} text-white rounded-lg ${buttonHover} transition-all duration-200 font-medium text-sm shadow-sm`}
                >
                  Start Quiz
                </button>
              </div>
            );
          })}
        </div>

        {/* Spacer and divider */}
        <div className="mb-12 mt-4">
          <div className="w-full max-w-3xl mx-auto border-b border-gray-300 opacity-30"></div>
        </div>

        {/* Release Notes Section */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 backdrop-blur-sm rounded-xl shadow-sm p-5 mb-6 border border-slate-200 max-w-5xl mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">Release Notes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Completed Features */}
            <div className="border-t-4 border-green-500 rounded-xl p-3 bg-green-50 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
              <h3 className="text-base font-semibold mb-2 flex items-center">
                <span className="text-green-600 mr-1 bg-green-100 w-5 h-5 rounded-full flex items-center justify-center text-xs">✓</span>
                <span className="ml-1">Completed Features</span>
              </h3>
              <ul className="space-y-1 text-xs">
                <li className="flex items-start">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Capital Cities Quiz with multiple choice options</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Country Flags Quiz with multiple choice and write mode</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Bollards Quiz for identifying street poles</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Continent filters for all quizzes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-1">•</span>
                  <span>GeoGuessr-only country mode</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Customizable timer and question count</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Detailed quiz results and statistics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Shareable quiz results via unique quiz ID</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Learning pages for each quiz category</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-1">•</span>
                  <span>License Plates Quiz (with blur option)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-1">•</span>
                  <span>Road Signs Quiz types</span>
                </li>
              </ul>
            </div>
            
            {/* In Progress Features */}
            <div className="border-t-4 border-yellow-500 rounded-xl p-3 bg-yellow-50 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
              <h3 className="text-base font-semibold mb-2 flex items-center">
                <span className="text-yellow-600 mr-1 bg-yellow-100 w-5 h-5 rounded-full flex items-center justify-center text-xs">⟳</span>
                <span className="ml-1">In Progress</span>
              </h3>
              <ul className="space-y-1 text-xs">
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-1">•</span>
                  <span>Road Signs Quiz (uploading more data)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-1">•</span>
                  <span>Performance optimizations for faster loading</span>
                </li>
              </ul>
            </div>
            
            {/* Planned Features */}
            <div className="border-t-4 border-blue-500 rounded-xl p-3 bg-blue-50 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
              <h3 className="text-base font-semibold mb-2 flex items-center">
                <span className="text-blue-600 mr-1 bg-blue-100 w-5 h-5 rounded-full flex items-center justify-center text-xs">○</span>
                <span className="ml-1">Planned Features</span>
              </h3>
              <ul className="space-y-1 text-xs">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  <span>Cars Quiz for vehicle identification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  <span>Domain quiz</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  <span>US License Plates regional quiz</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  <span>Phone Prefixes quiz for country codes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  <span>User accounts with progress tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  <span>Adaptive quizzes based on your performance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Quiz history and progress tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  <span>And more...</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p className="mt-1">
              Join the discussion on <a href="https://www.reddit.com/r/geoguessr/comments/1jcm67f/yet_another_bollard_and_more_quiz_test_it_if_you/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Reddit</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
