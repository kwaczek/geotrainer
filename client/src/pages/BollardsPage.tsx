import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';

// API Bollard interface as returned from the database
interface ApiBollard {
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

// Display Bollard interface used in the UI
interface Bollard {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  continent: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
}

// Transform API bollard to display bollard
const transformBollard = (bollard: ApiBollard): Bollard => {
  const country = bollard.countries && bollard.countries.length > 0 ? bollard.countries[0] : null;
  
  // Lookup continent by country code
  const getContinent = (countryCode: string, countryName: string): string => {
    // European countries
    if (['gb', 'uk', 'fr', 'de', 'es', 'it', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'ie', 'pl', 'pt', 'gr', 'ro', 'cz', 'hu', 'bg', 'hr', 'rs', 'sk', 'si', 'ee', 'lv', 'lt', 'cy', 'mt', 'lu', 'fo', 'tr'].includes(countryCode.toLowerCase())) {
      return 'Europe';
    }
    // North American countries
    if (['us', 'ca', 'mx', 'gt', 'bz', 'sv', 'hn', 'ni', 'cr', 'pa', 'cu', 'jm', 'ht', 'do', 'pr'].includes(countryCode.toLowerCase())) {
      return 'North America';
    }
    // South American countries
    if (['br', 'ar', 'co', 'pe', 'cl', 've', 'ec', 'bo', 'py', 'uy', 'gy', 'sr', 'gf'].includes(countryCode.toLowerCase())) {
      return 'South America';
    }
    // Asian countries
    if (['cn', 'jp', 'in', 'kr', 'id', 'sg', 'my', 'th', 'vn', 'ph', 'pk', 'bd', 'np', 'lk', 'kh', 'la', 'mm', 'kz', 'uz', 'kg', 'tm', 'mn', 'ru', 'hk', 'tw', 'sa', 'ae', 'il', 'jo', 'lb', 'kw', 'om', 'qa', 'bh', 'sy', 'iq', 'ir', 'af', 'ye'].includes(countryCode.toLowerCase())) {
      return 'Asia';
    }
    // African countries
    if (['za', 'ng', 'eg', 'dz', 'ma', 'ke', 'et', 'gh', 'tz', 'cd', 'ug', 'mg', 'sn', 'cm', 'ci', 'zw', 'rw', 'ml', 'mz', 'bw', 'ga', 'na', 'cg', 'sz', 'ls', 'gm', 'td', 'so', 'bf', 'sd', 'gn', 'bi', 'bj', 'er', 'lr', 'mu', 'tn'].includes(countryCode.toLowerCase())) {
      return 'Africa';
    }
    // Oceania countries
    if (['au', 'nz', 'pg', 'fj', 'sb', 'vu', 'nc', 'pf', 'ws', 'to', 'nr', 'ck', 'tv', 'pn', 'nu'].includes(countryCode.toLowerCase())) {
      return 'Oceania';
    }

    // Fallbacks based on country name
    const countryNameLower = countryName.toLowerCase();
    if (countryNameLower.includes('russia') || countryNameLower === 'russia') {
      return 'Asia'; // Russia spans both Europe and Asia, but let's categorize as Asia
    }
    
    return 'Unknown';
  };
  
  return {
    id: bollard._id,
    name: bollard.description.split('.')[0].trim(), // Use first sentence as name
    country: country?.name || 'Unknown',
    countryCode: country?.code || '',
    continent: country?.continent || getContinent(country?.code || '', country?.name || ''),
    imageUrl: bollard.imageUrl,
    description: bollard.description,
    googleMapsUrl: bollard.googleMapsUrl
  };
};

// Fallback data if database connection fails
const fallbackBollards: Bollard[] = [
  {
    id: 'ams-flex',
    name: 'Amsterdam Flex Bollard',
    country: 'Netherlands',
    countryCode: 'nl',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Amsterdam+Bollard',
    description: 'Flexible bollard designed to bend when hit',
    googleMapsUrl: 'https://www.google.com/maps/@52.377956,4.8970767,3a'
  },
  {
    id: 'lon-cast',
    name: 'London Cast Iron Bollard',
    country: 'United Kingdom',
    countryCode: 'gb',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=London+Bollard',
    description: 'Traditional cast iron bollard with distinctive London styling',
    googleMapsUrl: 'https://www.google.com/maps/@51.5073219,-0.1276474,3a'
  },
  {
    id: 'par-stone',
    name: 'Paris Stone Bollard',
    country: 'France',
    countryCode: 'fr',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Paris+Bollard',
    description: 'Historic stone bollard found throughout Paris',
    googleMapsUrl: 'https://www.google.com/maps/@48.8566969,2.3514616,3a'
  },
  {
    id: 'ny-concrete',
    name: 'New York Concrete Bollard',
    country: 'United States',
    countryCode: 'us',
    continent: 'North America',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=NY+Bollard',
    description: 'Security bollard designed for high-traffic areas',
    googleMapsUrl: 'https://www.google.com/maps/@40.7127281,-74.0060152,3a'
  },
  {
    id: 'tokyo-bollard',
    name: 'Tokyo Cylindrical Bollard',
    country: 'Japan',
    countryCode: 'jp',
    continent: 'Asia',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Tokyo+Bollard',
    description: 'Modern white cylindrical bollard with reflective surfaces',
    googleMapsUrl: 'https://www.google.com/maps/@35.6840574,139.7744912,3a'
  }
];

// Local storage keys
const BOLLARDS_FILTER_KEY = 'geotrainer_bollards_filter';

// Default filter settings
const defaultFilterSettings = {
  searchTerm: '',
  country: 'all',
  continent: 'all',
  sortBy: 'name',
  viewMode: 'grid' as const
};

// Get stored settings or default values
const getStoredSettings = () => {
  const stored = localStorage.getItem(BOLLARDS_FILTER_KEY);
  if (stored) {
    try {
      return { ...defaultFilterSettings, ...JSON.parse(stored) };
    } catch (e) {
      console.warn('Failed to parse stored settings, using defaults');
      return defaultFilterSettings;
    }
  }
  return defaultFilterSettings;
};

const BollardsPage: React.FC = () => {
  useDocumentTitle('Bollards', true);
  const [bollards, setBollards] = useState<Bollard[]>([]);
  const [filteredBollards, setFilteredBollards] = useState<Bollard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with values from localStorage or defaults
  const storedSettings = getStoredSettings();
  const [searchTerm, setSearchTerm] = useState<string>(storedSettings.searchTerm);
  const [selectedCountry, setSelectedCountry] = useState<string>(storedSettings.country);
  const [selectedContinent, setSelectedContinent] = useState<string>(storedSettings.continent);
  const [sortBy, setSortBy] = useState<string>(storedSettings.sortBy);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(storedSettings.viewMode);
  const [usingFallbackData, setUsingFallbackData] = useState<boolean>(false);

  // Fetch bollards on component mount
  useEffect(() => {
    const fetchBollards = async () => {
      try {
        setLoading(true);
        console.log('Fetching bollards from API...');
        const response = await axios.get('/api/bollards');
        console.log('API response received:', response.data);
        
        // If we got a response and it's an array, process it
        if (response.data && Array.isArray(response.data)) {
          console.log('Response is a direct array of bollards');
          // Transform the bollards to match our display format
          const transformedBollards = response.data.map(transformBollard);
          setBollards(transformedBollards);
          setUsingFallbackData(false);
        }
        // If the response has a bollards property that's an array
        else if (response.data && Array.isArray(response.data.bollards)) {
          console.log('Response has bollards array in data property');
          const transformedBollards = response.data.bollards.map(transformBollard);
          setBollards(transformedBollards);
          setUsingFallbackData(false);
        }
        // If none of the above formats match, use fallback
        else {
          console.warn('Unexpected API response format, using fallback data:', response.data);
          setBollards(fallbackBollards);
          setUsingFallbackData(true);
        }
      } catch (error) {
        console.error('Error fetching bollards:', error);
        console.warn('Using fallback bollard data due to connection error');
        setBollards(fallbackBollards);
        setUsingFallbackData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBollards();
  }, []);

  // Save filter settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      searchTerm,
      country: selectedCountry,
      continent: selectedContinent,
      sortBy,
      viewMode
    };
    localStorage.setItem(BOLLARDS_FILTER_KEY, JSON.stringify(settings));
  }, [searchTerm, selectedCountry, selectedContinent, sortBy, viewMode]);

  // Apply filters, search, and sort when dependencies change
  useEffect(() => {
    let result = [...bollards];

    // Apply country filter
    if (selectedCountry !== 'all') {
      result = result.filter(bollard => bollard.country === selectedCountry);
    }

    // Apply continent filter
    if (selectedContinent !== 'all') {
      result = result.filter(bollard => bollard.continent === selectedContinent);
    }

    // Apply search
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(bollard => 
        bollard.name.toLowerCase().includes(searchLower) || 
        bollard.country.toLowerCase().includes(searchLower) ||
        bollard.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    result = result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'country':
          return (a.country || '').localeCompare(b.country || '');
        case 'continent':
          return (a.continent || '').localeCompare(b.continent || '');
        default:
          return 0;
      }
    });

    setFilteredBollards(result);
  }, [bollards, selectedCountry, selectedContinent, searchTerm, sortBy]);

  // Get unique countries and continents for the filters
  const countries = Array.from(new Set(bollards.map(bollard => bollard.country))).sort();
  const continents = Array.from(new Set(bollards.map(bollard => bollard.continent))).sort();

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle country filter change
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
  };

  // Handle continent filter change
  const handleContinentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedContinent(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  // Handle view mode toggle
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCountry('all');
    setSelectedContinent('all');
    // Don't reset sort or view mode on filter reset
  };

  // Generate continent badge with appropriate color
  const ContinentBadge: React.FC<{ continent: string }> = ({ continent }) => {
    const getContinentColor = () => {
      switch (continent) {
        case 'Africa': return 'bg-yellow-100 text-yellow-800';
        case 'Asia': return 'bg-red-100 text-red-800';
        case 'Europe': return 'bg-blue-100 text-blue-800';
        case 'North America': return 'bg-green-100 text-green-800';
        case 'South America': return 'bg-purple-100 text-purple-800';
        case 'Oceania': return 'bg-indigo-100 text-indigo-800';
        case 'Antarctica': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getContinentColor()}`}>
        {continent}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading bollards...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Bollards of the World</h1>
      
      {usingFallbackData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Database connection unavailable. Showing sample bollard data for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters and Controls Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search by name, country, or description..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Country Filter */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              id="country"
              value={selectedCountry}
              onChange={handleCountryChange}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Continent Filter */}
          <div>
            <label htmlFor="continent" className="block text-sm font-medium text-gray-700 mb-1">Continent</label>
            <select
              id="continent"
              value={selectedContinent}
              onChange={handleContinentChange}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Continents</option>
              {continents.map(continent => (
                <option key={continent} value={continent}>{continent}</option>
              ))}
            </select>
          </div>

          {/* Sorting and View Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={handleSortChange}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="name">Name</option>
                <option value="country">Country</option>
                <option value="continent">Continent</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={toggleViewMode}
                className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {viewMode === 'grid' ? (
                  <>
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    List
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Grid
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Reset Filters Button */}
        {(selectedCountry !== 'all' || selectedContinent !== 'all' || searchTerm !== '') && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-6 text-gray-600">
        <p>Showing {filteredBollards.length} of {bollards.length} bollards</p>
      </div>

      {/* No results message */}
      {filteredBollards.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bollards found</h3>
          <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
          <button
            onClick={resetFilters}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Bollards Grid View */}
      {viewMode === 'grid' && filteredBollards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBollards.map(bollard => (
            <Link 
              to={usingFallbackData ? '#' : `/bollards/${bollard.id}`}
              key={bollard.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={e => {
                if (usingFallbackData) {
                  e.preventDefault();
                  alert('Bollard details are unavailable in demonstration mode.');
                }
              }}
            >
              {bollard.imageUrl && (
                <div className="h-48 bg-gray-100">
                  <img 
                    src={bollard.imageUrl} 
                    alt={`${bollard.name}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback for broken images
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/bollard-placeholder.png';
                    }}
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{bollard.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Country:</span> {bollard.country}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <ContinentBadge continent={bollard.continent} />
                  {bollard.countryCode && (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium uppercase">
                      {bollard.countryCode}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bollards List View */}
      {viewMode === 'list' && filteredBollards.length > 0 && (
        <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Continent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBollards.map(bollard => (
                <tr 
                  key={bollard.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    if (usingFallbackData) {
                      alert('Bollard details are unavailable in demonstration mode.');
                    } else {
                      window.location.href = `/bollards/${bollard.id}`;
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bollard.imageUrl ? (
                      <img 
                        src={bollard.imageUrl} 
                        alt={bollard.name}
                        className="h-16 w-16 object-cover rounded shadow-sm"
                        onError={(e) => {
                          // Fallback for broken images
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/images/bollard-placeholder.png';
                        }}
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded"></div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{bollard.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{bollard.country}</div>
                    {bollard.countryCode && (
                      <div className="text-xs text-gray-500 uppercase">{bollard.countryCode}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ContinentBadge continent={bollard.continent} />
                  </td>
                  <td className="px-6 py-4">
                    <a 
                      href={bollard.googleMapsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-800 text-xs inline-flex items-center"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View on Maps
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Info Card */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">What are bollards?</h2>
        <p className="text-blue-700 mb-4">
          Bollards are short posts used to create a protective or decorative barrier to define spaces, control traffic, or enhance security. 
          They can be found in various designs across different countries, reflecting local architecture and cultural preferences.
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          {continents.length > 0 && continents.map(continent => (
            <div key={continent} className="flex items-center">
              <div className={`h-4 w-4 rounded-full mr-2 ${continent === 'Africa' ? 'bg-yellow-500' : 
                                                          continent === 'Asia' ? 'bg-red-500' : 
                                                          continent === 'Europe' ? 'bg-blue-500' : 
                                                          continent === 'North America' ? 'bg-green-500' : 
                                                          continent === 'South America' ? 'bg-purple-500' : 
                                                          continent === 'Oceania' ? 'bg-indigo-500' : 'bg-gray-500'}`}></div>
              <span className="text-sm text-gray-700">{continent}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BollardsPage; 