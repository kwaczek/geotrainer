import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';

// API RoadSign interface as returned from the database
interface ApiRoadSign {
  _id: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: {
    _id: string;
    name: string;
    code: string;
    continent?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Display RoadSign interface used in the UI
interface RoadSign {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  continent: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
}

// Define FilterSettings type at the top with other interfaces
interface FilterSettings {
  searchTerm: string;
  country: string;
  continent: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
}

const RoadSignsPage: React.FC = () => {
  // Set the document title
  useDocumentTitle('Road Signs');
  
  // State for road signs data
  const [roadSigns, setRoadSigns] = useState<RoadSign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(24);
  const [countries, setCountries] = useState<{[key: string]: string}>({});
  const [continents, setContinents] = useState<string[]>([]);
  
  // Filter settings
  const [filters, setFilters] = useState<FilterSettings>({
    searchTerm: '',
    country: '',
    continent: '',
    sortBy: 'country',
    viewMode: 'grid'
  });
  
  // Transform API roadSign to display roadSign
  const transformRoadSign = (roadSign: ApiRoadSign): RoadSign => {
    const country = roadSign.countries && roadSign.countries.length > 0 ? roadSign.countries[0] : null;
    
    return {
      id: roadSign._id,
      name: `Road Sign from ${country?.name || 'Unknown Country'}`,
      country: country?.name || 'Unknown',
      countryCode: country?.code?.toLowerCase() || '',
      continent: country?.continent || 'Unknown',
      imageUrl: roadSign.imageUrl,
      description: roadSign.description,
      googleMapsUrl: roadSign.googleMapsUrl
    };
  };
  
  // Fetch road signs data
  useEffect(() => {
    const fetchRoadSigns = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/roadsigns');
        const transformedSigns = response.data.map(transformRoadSign);
        setRoadSigns(transformedSigns);
        
        // Extract unique countries and continents
        const uniqueCountries: {[key: string]: string} = {};
        const uniqueContinents = new Set<string>();
        
        transformedSigns.forEach((sign: RoadSign) => {
          if (sign.country && sign.countryCode) {
            uniqueCountries[sign.country] = sign.countryCode;
          }
          if (sign.continent) {
            uniqueContinents.add(sign.continent);
          }
        });
        
        setCountries(uniqueCountries);
        setContinents(Array.from(uniqueContinents).sort());
        
      } catch (err) {
        console.error('Error fetching road signs:', err);
        setError('Failed to load road signs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoadSigns();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (name: keyof FilterSettings, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  // Filter and sort road signs based on current filters
  const filteredRoadSigns = roadSigns
    .filter(sign => {
      // Apply search term filter
      if (filters.searchTerm && !sign.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) && 
          !sign.country.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Apply country filter
      if (filters.country && sign.country !== filters.country) {
        return false;
      }
      
      // Apply continent filter
      if (filters.continent && sign.continent !== filters.continent) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (filters.sortBy) {
        case 'country':
          return a.country.localeCompare(b.country);
        case 'continent':
          return a.continent.localeCompare(b.continent);
        default:
          return 0;
      }
    });
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRoadSigns.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRoadSigns.length / itemsPerPage);
  
  // Handle page changes
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Road Signs</h1>
          <p className="text-gray-600 mt-2">
            Learn to identify road signs from different countries. This knowledge can help in geo-location challenges.
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link to="/quiz/roadsigns/settings" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
            Start Quiz
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Search by country or description"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              className="w-full p-2 border rounded"
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
            >
              <option value="">All Countries</option>
              {Object.entries(countries).map(([name, code]) => (
                <option key={code} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Continent</label>
            <select
              className="w-full p-2 border rounded"
              value={filters.continent}
              onChange={(e) => handleFilterChange('continent', e.target.value)}
            >
              <option value="">All Continents</option>
              {continents.map(continent => (
                <option key={continent} value={continent}>
                  {continent}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              className="w-full p-2 border rounded"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="country">Country</option>
              <option value="continent">Continent</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filteredRoadSigns.length} road signs found
          </div>
          
          <div className="flex space-x-2">
            <button
              className={`p-2 rounded ${filters.viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => handleFilterChange('viewMode', 'grid')}
            >
              Grid
            </button>
            <button
              className={`p-2 rounded ${filters.viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => handleFilterChange('viewMode', 'list')}
            >
              List
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading road signs...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Road Signs Grid/List */}
      {!loading && !error && (
        <>
          {currentItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No road signs found matching your filters.</p>
            </div>
          ) : filters.viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentItems.map(sign => (
                <div key={sign.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="relative pb-2/3">
                    <img
                      src={sign.imageUrl}
                      alt={sign.description}
                      className="absolute h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      {sign.countryCode && (
                        <img
                          src={`https://flagcdn.com/w40/${sign.countryCode.toLowerCase()}.png`}
                          alt={`${sign.country} flag`}
                          className="w-6 h-4 mr-2"
                        />
                      )}
                      <h3 className="font-semibold">{sign.country}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{sign.description}</p>
                    <a
                      href={sign.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 text-sm hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Continent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Map
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map(sign => (
                    <tr key={sign.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-20 h-12 overflow-hidden">
                          <img
                            src={sign.imageUrl}
                            alt={sign.description}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {sign.countryCode && (
                            <img
                              src={`https://flagcdn.com/w40/${sign.countryCode.toLowerCase()}.png`}
                              alt={`${sign.country} flag`}
                              className="w-6 h-4 mr-2"
                            />
                          )}
                          <span>{sign.country}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{sign.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{sign.continent}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={sign.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-l-md border ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`px-4 py-2 border-t border-b ${
                      currentPage === i + 1
                        ? 'bg-blue-500 text-white'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-r-md border ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
      
      {/* Educational Section */}
      <div className="mt-12 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">About Road Signs</h2>
        <p className="mb-4">
          Road signs are a valuable geographical clue when trying to determine a location. Different countries and regions
          have distinct designs, colors, and shapes for their road signs, making them useful identifiers in geolocation games
          like GeoGuessr.
        </p>
        <p className="mb-4">
          Key differences to look for include:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Shape and color schemes unique to regions (e.g., European vs. North American standards)</li>
          <li className="mb-2">Text language and typography</li>
          <li className="mb-2">Unique symbols or pictograms</li>
          <li className="mb-2">Specific warning or regulatory designs</li>
        </ul>
        <p>
          Practice identifying these differences to improve your geolocation skills and score better in geography quizzes!
        </p>
      </div>
    </div>
  );
};

export default RoadSignsPage; 