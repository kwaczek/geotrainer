import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import CountryInfoCard from '../components/CountryInfoCard';

interface Country {
  id: string;
  _id?: string;
  name: string;
  capital: string;
  continent: string;
  code: string;
  flagUrl?: string;
  in_geoguessr: boolean;
  domain?: string[];
  currency?: { name: string; symbol: string; code: string }[];
  population?: number;
  area?: number;
  phone_prefix?: string;
  driving_side?: 'left' | 'right';
  camera_generation?: Record<string, string>;
  alpha2Code?: string;
  code2?: string;
  alpha2?: string;
}

// Utility function to get flag URL from country code
const getFlagUrl = (code: string): string => {
  if (!code) return '/images/flag-placeholder.png';
  
  // Standardize the code - most countries use ISO 2-letter codes
  const normalizedCode = code.toLowerCase().trim();
  
  // Handle special cases if needed
  const codeMap: Record<string, string> = {
    'uk': 'gb', // United Kingdom uses 'gb' in flagcdn
    'korea, south': 'kr',
    'korea, north': 'kp', 
    'united states': 'us',
    'russia': 'ru',
    'china': 'cn'
  };
  
  const finalCode = codeMap[normalizedCode] || normalizedCode;
  
  // If code is longer than 2 characters and doesn't have special handling,
  // it's likely not a valid ISO country code for flagcdn
  if (finalCode.length !== 2 && !codeMap[normalizedCode]) {
    console.warn(`Possibly invalid country code for flag: ${code}`);
    return '/images/flag-placeholder.png';
  }
  
  console.log(`Generating flag URL for ${code} -> ${finalCode}`);
  return `https://flagcdn.com/w320/${finalCode}.png`;
};

// Fallback data if database connection fails
const fallbackCountries: Country[] = [
  {
    id: 'usa',
    name: 'United States',
    capital: 'Washington D.C.',
    continent: 'North America',
    code: 'us',
    flagUrl: getFlagUrl('us'),
    in_geoguessr: true
  },
  {
    id: 'germany',
    name: 'Germany',
    capital: 'Berlin',
    continent: 'Europe',
    code: 'de',
    flagUrl: getFlagUrl('de'),
    in_geoguessr: true
  },
  {
    id: 'japan',
    name: 'Japan',
    capital: 'Tokyo',
    continent: 'Asia',
    code: 'jp',
    flagUrl: getFlagUrl('jp'),
    in_geoguessr: true
  },
  {
    id: 'australia',
    name: 'Australia',
    capital: 'Canberra',
    continent: 'Oceania',
    code: 'au',
    flagUrl: getFlagUrl('au'),
    in_geoguessr: true,
    driving_side: 'left'
  },
  {
    id: 'brazil',
    name: 'Brazil',
    capital: 'Brasília',
    continent: 'South America',
    code: 'br',
    flagUrl: getFlagUrl('br'),
    in_geoguessr: true
  },
  {
    id: 'egypt',
    name: 'Egypt',
    capital: 'Cairo',
    continent: 'Africa',
    code: 'eg',
    flagUrl: getFlagUrl('eg'),
    in_geoguessr: true,
    currency: [{name: "Egyptian Pound", symbol: "E£", code: "EGP"}]
  }
];

// Local storage keys
const COUNTRIES_FILTER_KEY = 'geotrainer_countries_filter';

// Default filter settings
const defaultFilterSettings = {
  searchTerm: '',
  continent: 'all',
  geoGuessrOnly: false,
  sortBy: 'name',
  viewMode: 'grid' as const
};

// Get stored settings or default values
const getStoredSettings = () => {
  const stored = localStorage.getItem(COUNTRIES_FILTER_KEY);
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

const CountriesPage: React.FC = () => {
  useDocumentTitle('Countries', true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryDetails, setShowCountryDetails] = useState<boolean>(false);
  
  // Initialize with values from localStorage or defaults
  const storedSettings = getStoredSettings();
  const [searchTerm, setSearchTerm] = useState<string>(storedSettings.searchTerm);
  const [selectedContinent, setSelectedContinent] = useState<string>(storedSettings.continent);
  const [showGeoGuessrOnly, setShowGeoGuessrOnly] = useState<boolean>(storedSettings.geoGuessrOnly);
  const [sortBy, setSortBy] = useState<string>(storedSettings.sortBy);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(storedSettings.viewMode);
  const [usingFallbackData, setUsingFallbackData] = useState<boolean>(false);

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/countries');
        if (response.data.success) {
          console.log('Raw countries data sample:', response.data.countries.slice(0, 3));
          
          // Ensure all countries have flagUrl and valid code
          const countriesWithFlags = response.data.countries.map((country: Country) => {
            // Clean and normalize the country code
            let code = country.code || '';
            
            // For codes longer than 2 characters, try to extract valid ISO code
            if (code.length > 2) {
              // If it looks like an ISO3 code, convert it or use first 2 chars
              code = code.substring(0, 2);
            }
            
            // Generate flag URL based on code
            const flagUrl = country.flagUrl || (code ? getFlagUrl(code) : '/images/flag-placeholder.png');
            
            return {
              ...country,
              id: country._id || country.id, // Handle both MongoDB _id and id
              code: code,
              flagUrl: flagUrl
            };
          });
          
          setCountries(countriesWithFlags);
          console.log('Processed first country:', countriesWithFlags[0]);
        } else {
          console.warn('Failed to fetch countries, using fallback data');
          setCountries(fallbackCountries);
          setUsingFallbackData(true);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        console.warn('Using fallback country data due to connection error');
        setCountries(fallbackCountries);
        setUsingFallbackData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Save filter settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      searchTerm,
      continent: selectedContinent,
      geoGuessrOnly: showGeoGuessrOnly,
      sortBy,
      viewMode
    };
    localStorage.setItem(COUNTRIES_FILTER_KEY, JSON.stringify(settings));
  }, [searchTerm, selectedContinent, showGeoGuessrOnly, sortBy, viewMode]);

  // Apply filters, search, and sort when dependencies change
  useEffect(() => {
    let result = [...countries];

    // Apply continent filter
    if (selectedContinent !== 'all') {
      result = result.filter(country => country.continent === selectedContinent);
    }

    // Apply GeoGuessr filter
    if (showGeoGuessrOnly) {
      result = result.filter(country => country.in_geoguessr);
    }

    // Apply search
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(country => 
        country.name.toLowerCase().includes(searchLower) || 
        country.capital.toLowerCase().includes(searchLower) ||
        country.code?.toLowerCase().includes(searchLower) || 
        country.domain?.some(d => d.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    result = result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'capital':
          return a.capital.localeCompare(b.capital);
        case 'continent':
          return a.continent.localeCompare(b.continent);
        default:
          return 0;
      }
    });

    setFilteredCountries(result);
  }, [countries, selectedContinent, showGeoGuessrOnly, searchTerm, sortBy]);

  // Get unique continents for the filter
  const continents = Array.from(new Set(countries.map(country => country.continent))).sort();

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle continent filter change
  const handleContinentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedContinent(e.target.value);
  };

  // Handle GeoGuessr filter toggle
  const handleGeoGuessrToggle = () => {
    setShowGeoGuessrOnly(!showGeoGuessrOnly);
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
    setSelectedContinent('all');
    setShowGeoGuessrOnly(false);
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
        <p className="mt-4 text-gray-600">Loading countries...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Countries of the World</h1>
      
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
                Database connection unavailable. Showing sample country data for demonstration purposes.
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
                placeholder="Search by name or capital..."
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

          {/* Sorting */}
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={handleSortChange}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="name">Country Name</option>
              <option value="capital">Capital</option>
              <option value="continent">Continent</option>
            </select>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-col justify-end">
            <div className="flex items-center h-10 mt-auto">
              <input
                id="geoguessr-toggle"
                type="checkbox"
                checked={showGeoGuessrOnly}
                onChange={handleGeoGuessrToggle}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="geoguessr-toggle" className="ml-2 block text-sm text-gray-700">
                GeoGuessr Countries Only
              </label>
              
              <button
                onClick={toggleViewMode}
                className="ml-auto inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
      </div>

      {/* Results count */}
      <div className="mb-6 text-gray-600">
        <p>Showing {filteredCountries.length} of {countries.length} countries</p>
      </div>

      {/* No results message */}
      {filteredCountries.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No countries found</h3>
          <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
          <button
            onClick={resetFilters}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Countries Grid View */}
      {viewMode === 'grid' && filteredCountries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCountries.map(country => {
            // For debugging
            console.log(`Grid view - Rendering flag for ${country.name}: ${country.flagUrl || 'N/A'}, code: ${country.code || 'N/A'}`);
            
            return (
              <Link 
                to={usingFallbackData ? '#' : `/countries/${country.id}`}
                key={country.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                onClick={(e) => {
                  if (usingFallbackData) {
                    e.preventDefault();
                    alert('Country details are unavailable in demonstration mode.');
                  }
                }}
              >
                <div className="h-40 bg-gray-100">
                  <img 
                    src={country.flagUrl || (country.code ? getFlagUrl(country.code) : '/images/flag-placeholder.png')} 
                    alt={`Flag of ${country.name}`} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback for broken flag images
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/flag-placeholder.png';
                      console.log(`Flag image error for ${country.name}`);
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{country.name}</h3>
                    {country.in_geoguessr && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">GeoGuessr</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Capital:</span> {country.capital || 'N/A'}
                  </p>
                  {/* Display Population and Area if available */}
                  {country.population !== undefined && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Population:</span> {country.population.toLocaleString()}
                    </p>
                  )}
                  {country.area !== undefined && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Area:</span> {country.area.toLocaleString()} km²
                    </p>
                  )}
                  <div className="mt-2">
                    <ContinentBadge continent={country.continent} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Countries List View */}
      {viewMode === 'list' && filteredCountries.length > 0 && (
        <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flag
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capital
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Continent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Population
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area (km²)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driving Side
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GeoGuessr
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCountries.map(country => {
                  // For debugging
                  console.log(`List view - Rendering flag for ${country.name}: ${country.flagUrl || 'N/A'}, code: ${country.code || 'N/A'}`);
                  
                  return (
                    <tr 
                      key={country.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => {
                        if (usingFallbackData) {
                          alert('Country details are unavailable in demonstration mode.');
                        } else {
                          // Use Link for consistent navigation with history
                          const link = document.createElement('a');
                          link.href = `/countries/${country.id}`;
                          link.click();
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {country.code ? (
                          <img 
                            src={country.flagUrl || getFlagUrl(country.code)} 
                            alt={`Flag of ${country.name}`}
                            className="h-8 w-12 object-contain rounded shadow-sm"
                            onError={(e) => {
                              // Fallback for broken flag images
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/images/flag-placeholder.png';
                              console.log(`Flag image error for ${country.name} in list view`);
                            }}
                          />
                        ) : (
                          <div className="h-8 w-12 bg-gray-200 rounded"></div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{country.name}</div>
                        {country.code && (
                          <div className="text-xs text-gray-500">Code: {country.code.toUpperCase()}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{country.capital || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ContinentBadge continent={country.continent} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {country.population?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {country.area?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {country.currency && country.currency.length > 0 
                          ? (
                            <div>
                              <div>{country.currency[0].name}</div>
                              <div className="text-xs">{country.currency[0].symbol} ({country.currency[0].code})</div>
                            </div>
                          )
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {country.driving_side 
                          ? <span className={country.driving_side === 'left' ? 'text-purple-600' : 'text-blue-600'}>
                              {country.driving_side.charAt(0).toUpperCase() + country.driving_side.slice(1)}
                            </span>
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {country.phone_prefix || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {country.domain && country.domain.length > 0 
                          ? country.domain.map(d => <div key={d}>.{d}</div>)
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {country.in_geoguessr ? (
                          <span className="text-green-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        ) : (
                          <span className="text-red-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountriesPage; 