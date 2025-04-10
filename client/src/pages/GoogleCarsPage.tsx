import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getImageUrl } from '../config/apiConfig'; // Import getImageUrl

// API GoogleCar interface as returned from the database
interface ApiGoogleCar {
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

// Display GoogleCar interface used in the UI
interface GoogleCar {
  id: string;
  name: string; // Derived from description
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

// Transform API GoogleCar to display GoogleCar
const transformGoogleCar = (googleCar: ApiGoogleCar): GoogleCar => {
  const country = googleCar.countries && googleCar.countries.length > 0 ? googleCar.countries[0] : null;
  
  // Map continent based on country code for better reliability
  const getContinent = (countryCode: string): string => {
    const europe = ['at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu', 
                     'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 
                     'se', 'gb', 'ad', 'al', 'by', 'ba', 'fo', 'gi', 'is', 'li', 'mk', 'md', 'mc', 
                     'me', 'no', 'ru', 'sm', 'rs', 'ch', 'ua', 'va', 'uk', 'im', 'tr'];
    
    const northAmerica = ['ca', 'us', 'mx', 'gt', 'bz', 'hn', 'sv', 'ni', 'cr', 'pa'];
    
    const southAmerica = ['ar', 'bo', 'br', 'cl', 'co', 'ec', 'gy', 'py', 'pe', 'sr', 'uy', 've'];
    
    const asia = ['af', 'am', 'az', 'bh', 'bd', 'bt', 'bn', 'kh', 'cn', 'cy', 'ge', 'in', 'id', 
                   'ir', 'iq', 'il', 'jp', 'jo', 'kz', 'kw', 'kg', 'la', 'lb', 'my', 'mv', 'mn', 
                   'mm', 'np', 'kp', 'om', 'pk', 'ph', 'qa', 'sa', 'sg', 'kr', 'lk', 'sy', 'tw', 
                   'tj', 'th', 'tl', 'tr', 'tm', 'ae', 'uz', 'vn', 'ye', 'ru'];
    
    const africa = ['dz', 'ao', 'bj', 'bw', 'bf', 'bi', 'cm', 'cv', 'cf', 'td', 'km', 'cd', 'cg', 
                     'ci', 'dj', 'eg', 'gq', 'er', 'et', 'ga', 'gm', 'gh', 'gn', 'gw', 'ke', 'ls', 
                     'lr', 'ly', 'mg', 'mw', 'ml', 'mr', 'mu', 'ma', 'mz', 'na', 'ne', 'ng', 'rw', 
                     'st', 'sn', 'sc', 'sl', 'so', 'za', 'ss', 'sd', 'sz', 'tz', 'tg', 'tn', 'ug', 'zm', 'zw'];
    
    const oceania = ['au', 'fj', 'ki', 'mh', 'fm', 'nr', 'nz', 'pw', 'pg', 'ws', 'sb', 'to', 'tv', 'vu'];
    
    const code = countryCode.toLowerCase();
    
    if (europe.includes(code)) return 'Europe';
    if (northAmerica.includes(code)) return 'North America';
    if (southAmerica.includes(code)) return 'South America';
    if (asia.includes(code)) return 'Asia';
    if (africa.includes(code)) return 'Africa';
    if (oceania.includes(code)) return 'Oceania';
    
    // Fallback mapping for country names if code isn't available
    if (!code) {
      const countryName = country?.name || '';
      const lowerName = countryName.toLowerCase();
      
      if (['russia', 'turkey'].includes(lowerName)) return 'Asia';
      if (['united kingdom', 'uk', 'france', 'germany', 'italy', 'spain'].includes(lowerName)) return 'Europe';
      if (['united states', 'usa', 'canada', 'mexico'].includes(lowerName)) return 'North America';
      if (['brazil', 'argentina', 'chile', 'peru'].includes(lowerName)) return 'South America';
      if (['china', 'japan', 'india', 'thailand'].includes(lowerName)) return 'Asia';
      if (['australia', 'new zealand'].includes(lowerName)) return 'Oceania';
      if (['egypt', 'south africa', 'nigeria', 'kenya'].includes(lowerName)) return 'Africa';
    }
    
    return 'Unknown';
  };
  
  let continent = 'Unknown';
  
  // Try to get the continent from the country object first
  if (country && country.continent) {
    continent = country.continent;
    // console.log(`Got continent ${continent} directly from country object for ${country.name}`);
  } else {
    // If not available, try to determine from country code
    continent = getContinent(country?.code || '');
    // console.log(`Determined continent ${continent} from code for ${country?.name}`);
  }
  
  return {
    id: googleCar._id,
    name: googleCar.description.split('.')[0].trim() || 'Google Car', // Use first sentence as name or default
    country: country?.name || 'Unknown',
    countryCode: country?.code || '',
    continent: continent,
    imageUrl: googleCar.imageUrl,
    description: googleCar.description,
    googleMapsUrl: googleCar.googleMapsUrl
  };
};

// Fallback data if database connection fails
const fallbackGoogleCars: GoogleCar[] = [
  {
    id: 'us-gen4',
    name: 'Google Car Gen 4 (USA)',
    country: 'United States',
    countryCode: 'us',
    continent: 'North America',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=US+Gen+4',
    description: 'The 4th generation Google Street View car commonly seen in the USA.',
    googleMapsUrl: 'https://www.google.com/maps/@40.7127281,-74.0060152,3a'
  },
  {
    id: 'eu-gen3',
    name: 'Google Car Gen 3 (Europe)',
    country: 'France',
    countryCode: 'fr',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=EU+Gen+3',
    description: 'A 3rd generation Google Street View car, often white, seen across Europe.',
    googleMapsUrl: 'https://www.google.com/maps/@48.8566969,2.3514616,3a'
  },
    {
    id: 'jp-gen3-blue',
    name: 'Google Car Gen 3 (Japan)',
    country: 'Japan',
    countryCode: 'jp',
    continent: 'Asia',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=JP+Gen+3',
    description: 'The blue variant of the Gen 3 car primarily used in Japan.',
    googleMapsUrl: 'https://www.google.com/maps/@35.6840574,139.7744912,3a'
  }
];

// Find and replace the localStorage key to match what's being used
const STORAGE_KEY = 'geotrainer_googlecars_filter';

// Default filter settings
const defaultFilterSettings = {
  searchTerm: '',
  country: 'All Countries',
  continent: 'All Continents',
  sortBy: 'country', // Default sort by country
  viewMode: 'grid' as const
};

// Utility functions for localStorage
const saveSettingsToStorage = (settings: FilterSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // console.log('Settings saved to localStorage:', settings);
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
};

const getStoredSettings = (): FilterSettings => {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (storedSettings) {
      // console.log('Retrieved settings from localStorage:', storedSettings);
      return JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error('Error retrieving settings from localStorage:', error);
  }
  
  // Default settings if nothing in localStorage or error occurs
  return defaultFilterSettings;
};

const GoogleCarsPage: React.FC = () => {
  useDocumentTitle('Google Cars', true);
  const [googleCars, setGoogleCars] = useState<GoogleCar[]>([]);
  const [filteredGoogleCars, setFilteredGoogleCars] = useState<GoogleCar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState<{name: string, continent: string}[]>([]);
  const [availableContinents, setAvailableContinents] = useState<string[]>([]);
  const [selectedGoogleCar, setSelectedGoogleCar] = useState<GoogleCar | null>(null);
  
  // Initialize with values from localStorage or defaults
  const storedSettings = getStoredSettings();
  // console.log('Using stored settings:', storedSettings);

  const [searchTerm, setSearchTerm] = useState<string>(storedSettings.searchTerm || '');
  const [selectedCountry, setSelectedCountry] = useState<string>(storedSettings.country || 'All Countries');
  const [selectedContinent, setSelectedContinent] = useState<string>(storedSettings.continent || 'All Continents');
  const [sortBy, setSortBy] = useState<string>(storedSettings.sortBy || 'country');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(storedSettings.viewMode || 'grid');
  const [usingFallbackData, setUsingFallbackData] = useState<boolean>(false);
  
  // Initialize app and force filter reset
  useEffect(() => {
    // console.log('App initialized, using filters from localStorage');
    // console.log('Currently selected country:', selectedCountry);
    // console.log('Currently selected continent:', selectedContinent);
  }, []);

  // Debugger effect - trace what happens to state
  // useEffect(() => {
  //   console.log('=== Debug State (Google Cars) ===');
  //   console.log('Google Cars count:', googleCars.length);
  //   console.log('First Google Car:', googleCars.length > 0 ? googleCars[0] : 'none');
  //   console.log('Filtered Google Cars count:', filteredGoogleCars.length);
  //   console.log('Selected country:', selectedCountry);
  //   console.log('Selected continent:', selectedContinent);
  //   console.log('Available continents:', availableContinents);
  //   console.log('Available countries:', availableCountries.length);
  //   console.log('=== End Debug ===');
  // }, [googleCars, filteredGoogleCars, selectedCountry, selectedContinent, availableContinents, availableCountries]);

  // Update the fetchData function
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error state
        // console.log('Fetching Google Car data from API...');
        
        // Fetch countries and continents first (using general endpoint for consistency)
        try {
          // console.log('Fetching countries and continents...');
          const countriesResponse = await axios.get('/api/countries'); // Use general country endpoint
          // console.log('API countries response:', countriesResponse.data);
          
          if (countriesResponse.data && Array.isArray(countriesResponse.data)) {
            const countries = countriesResponse.data.map((country: any) => ({
              name: country.name,
              continent: country.continent || 'Unknown'
            })).sort((a: any, b: any) => a.name.localeCompare(b.name));
            
            setAvailableCountries(countries);
            // console.log('Countries loaded from API:', countries.length);
            
            // Get unique continents from countries
            const continents = Array.from(
              new Set(countries.map((c: any) => c.continent || 'Unknown'))
            ).filter(Boolean).sort();
            
            // Ensure 'All Continents' is in the list but don't overwrite user's selected filter
            if (!continents.includes('All Continents')) {
              setAvailableContinents(['All Continents', ...continents]);
            } else {
              setAvailableContinents(continents);
            }
            // console.log('Continents derived from API countries:', continents);
          }
        } catch (err) {
          console.warn('Could not fetch countries from API:', err);
          // Will fallback to extracting from google cars
        }
        
        // Try to get continents separately if available
        try {
          const continentsResponse = await axios.get('/api/countries/continents');
          // console.log('API continents response:', continentsResponse.data);
          
          if (continentsResponse.data && continentsResponse.data.continents && 
              Array.isArray(continentsResponse.data.continents) && 
              continentsResponse.data.continents.length > 0) {
            const continentList = continentsResponse.data.continents;
            if (!continentList.includes('All Continents')) {
              const newContinents = ['All Continents', ...continentList];
              setAvailableContinents(newContinents);
              // console.log('Setting available continents with All Continents added:', newContinents);
            } else {
              setAvailableContinents(continentList);
              // console.log('Setting available continents as provided by API:', continentList);
            }
            // console.log('Continents loaded from API:', continentsResponse.data.continents);
          }
        } catch (err) {
          console.warn('Could not fetch continents from API:', err);
          // Fallback handled below
        }
        
        // Now fetch Google Cars
        const googleCarResponse = await axios.get('/api/google-cars'); // Use Google Car endpoint
        // console.log('API Google Cars response received:', googleCarResponse.data);
        
        let transformedGoogleCars: GoogleCar[] = [];
        if (googleCarResponse.data && Array.isArray(googleCarResponse.data)) {
          // console.log('Response is a direct array of Google Cars with length:', googleCarResponse.data.length);
          transformedGoogleCars = googleCarResponse.data.map(transformGoogleCar);
          // console.log('Transformed Google Cars:', transformedGoogleCars.length);
          // console.log('First transformed Google Car:', transformedGoogleCars.length > 0 ? transformedGoogleCars[0] : 'none');
          setGoogleCars(transformedGoogleCars);
          setUsingFallbackData(false);
        } else {
          console.warn('Unexpected API response format for Google Cars, using fallback data:', googleCarResponse.data);
          setGoogleCars(fallbackGoogleCars);
          setUsingFallbackData(true);
          transformedGoogleCars = fallbackGoogleCars;
        }
        
        // console.log('Total Google Cars loaded:', transformedGoogleCars.length);

        // Fallback: Extract countries/continents from loaded data if API calls failed
        if (availableCountries.length === 0 && transformedGoogleCars.length > 0) {
          // console.log('Extracting countries from Google Cars as fallback...');
          const uniqueCountries = Array.from(
            new Set(transformedGoogleCars.map(gc => gc.country))
          ).map(countryName => {
            const gc = transformedGoogleCars.find(g => g.country === countryName);
            return {
              name: countryName,
              continent: gc?.continent || 'Unknown'
            };
          }).sort((a, b) => a.name.localeCompare(b.name));
          
          // console.log('Extracted countries from Google Cars:', uniqueCountries.length);
          setAvailableCountries(uniqueCountries);
        }
        
        if (availableContinents.length === 0 && transformedGoogleCars.length > 0) {
          // console.log('Extracting continents from Google Cars as fallback...');
          const uniqueContinents = Array.from(
            new Set(transformedGoogleCars.map(gc => gc.continent))
          ).filter(Boolean).sort();
          
          if (!uniqueContinents.includes('All Continents')) {
            uniqueContinents.unshift('All Continents');
          }
          
          // console.log('Extracted continents from Google Cars:', uniqueContinents);
          setAvailableContinents(uniqueContinents);
        }
        
      } catch (error) {
        console.error('Error fetching Google Car data:', error);
        setError('Failed to load Google Car data. Displaying sample data.');
        setGoogleCars(fallbackGoogleCars);
        setUsingFallbackData(true);
        
        // Fallback for countries/continents from fallback data
        if (availableCountries.length === 0) {
           const uniqueCountries = Array.from(
            new Set(fallbackGoogleCars.map(gc => gc.country))
          ).map(countryName => {
            const gc = fallbackGoogleCars.find(g => g.country === countryName);
            return { name: countryName, continent: gc?.continent || 'Unknown' };
          }).sort((a, b) => a.name.localeCompare(b.name));
          // console.log('Using fallback countries:', uniqueCountries.length);
          setAvailableCountries(uniqueCountries);
        }
        
        if (availableContinents.length === 0) {
          const uniqueContinents = Array.from(new Set(fallbackGoogleCars.map(gc => gc.continent))).filter(Boolean).sort();
          if (!uniqueContinents.includes('All Continents')) {
            uniqueContinents.unshift('All Continents');
          }
          // console.log('Using fallback continents:', uniqueContinents);
          setAvailableContinents(uniqueContinents);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const currentSettings: FilterSettings = {
      searchTerm,
      country: selectedCountry,
      continent: selectedContinent,
      sortBy,
      viewMode
    };
    
    saveSettingsToStorage(currentSettings);
  }, [searchTerm, selectedCountry, selectedContinent, sortBy, viewMode]);

  // Check filter validity when options load
  useEffect(() => {
    if (availableCountries.length > 0 && selectedCountry !== 'All Countries') {
      if (!availableCountries.some(c => c.name === selectedCountry)) {
        // console.log('Selected country not found, resetting to All Countries');
        setSelectedCountry('All Countries');
      }
    }
    
    if (availableContinents.length > 0 && selectedContinent !== 'All Continents') {
      if (!availableContinents.includes(selectedContinent)) {
        // console.log('Selected continent not found, resetting to All Continents');
        setSelectedContinent('All Continents');
      }
    }
  }, [availableCountries, availableContinents, selectedCountry, selectedContinent]);

  // Update the filtering logic
  useEffect(() => {
    // console.log('Filtering Google Cars...');
    
    let result = [...googleCars];
    // console.log('Initial result count:', result.length);

    if (selectedContinent && selectedContinent !== 'All Continents') {
      // console.log('Filtering by continent:', selectedContinent);
      result = result.filter(gc => gc.continent === selectedContinent);
      // console.log('After continent filter:', result.length);
    }

    if (selectedCountry && selectedCountry !== 'All Countries') {
      // console.log('Filtering by country:', selectedCountry);
      result = result.filter(gc => gc.country === selectedCountry);
      // console.log('After country filter:', result.length);
    }

    // Apply search
    if (searchTerm.trim() !== '') {
      // console.log('Filtering by search term:', searchTerm);
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(gc => 
        gc.name.toLowerCase().includes(searchLower) || 
        gc.country.toLowerCase().includes(searchLower) ||
        gc.description.toLowerCase().includes(searchLower)
      );
      // console.log('After search filter:', result.length);
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

    // console.log('Final filtered count:', result.length);
    setFilteredGoogleCars(result);
  }, [googleCars, selectedCountry, selectedContinent, searchTerm, sortBy]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCountry(e.target.value);
  const handleContinentChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedContinent(e.target.value);
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value);
  const toggleViewMode = () => setViewMode(viewMode === 'grid' ? 'list' : 'grid');

  const resetFilters = () => {
    // console.log('Filter reset requested');
    setSearchTerm('');
    setSelectedCountry('All Countries');
    setSelectedContinent('All Continents');
    // Keep sortBy and viewMode
  };

  // Component for Continent Badge
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
    return <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getContinentColor()}`}>{continent}</span>;
  };

  // Keyboard support for modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedGoogleCar) {
        setSelectedGoogleCar(null);
      }
    };
    if (selectedGoogleCar) document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [selectedGoogleCar]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading Google Cars...</p>
      </div>
    );
  }

  // Main component render
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Google Cars of the World</h1>
      
      {(usingFallbackData || error) && (
        <div className={`border-l-4 p-4 mb-6 ${error ? 'bg-red-50 border-red-400' : 'bg-yellow-50 border-yellow-400'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${error ? 'text-red-400' : 'text-yellow-400'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm ${error ? 'text-red-700' : 'text-yellow-700'}`}>
                {error || 'Database connection unavailable. Showing sample Google Car data.'}
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
                type="text" id="search" placeholder="Search by description, country..."
                value={searchTerm} onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>

          {/* Country Filter */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select id="country" value={selectedCountry} onChange={handleCountryChange} className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
              <option value="All Countries">All Countries</option>
              {availableCountries.map(country => <option key={country.name} value={country.name}>{country.name}</option>)}
            </select>
          </div>

          {/* Continent Filter */}
          <div>
            <label htmlFor="continent" className="block text-sm font-medium text-gray-700 mb-1">Continent</label>
            <select id="continent" value={selectedContinent} onChange={handleContinentChange} className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
              <option value="All Continents">All Continents</option>
              {availableContinents.filter(c => c !== 'All Continents').map(continent => <option key={continent} value={continent}>{continent}</option>)}
            </select>
          </div>

          {/* Sorting and View Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select id="sortBy" value={sortBy} onChange={handleSortChange} className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option value="name">Name/Description</option>
                <option value="country">Country</option>
                <option value="continent">Continent</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={toggleViewMode} className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {viewMode === 'grid' ? (
                  <><svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>List</>
                ) : (
                  <><svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>Grid</>
                )}
              </button>
            </div>
          </div>
        </div>
        {(selectedCountry !== 'All Countries' || selectedContinent !== 'All Continents' || searchTerm !== '') && (
          <div className="mt-4 flex justify-end">
            <button onClick={resetFilters} className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-6 text-gray-600">
        <p>Showing {filteredGoogleCars.length} of {googleCars.length} Google Cars</p>
      </div>

      {/* No results message */}
      {filteredGoogleCars.length === 0 && !loading && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Google Cars found</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
          <button onClick={resetFilters} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Reset Filters
          </button>
        </div>
      )}

      {/* Google Cars Grid View */}
      {viewMode === 'grid' && filteredGoogleCars.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredGoogleCars.map(googleCar => (
            <div key={googleCar.id} onClick={() => setSelectedGoogleCar(googleCar)}
                 className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              {googleCar.imageUrl && (
                <div className="h-48 bg-gray-100">
                  <img src={getImageUrl(googleCar.imageUrl)} alt={`${googleCar.name}`} className="w-full h-full object-cover"
                       onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = '/images/googlecar-placeholder.png'; }} />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate" title={googleCar.name}>{googleCar.name}</h3>
                <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Country:</span> {googleCar.country}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <ContinentBadge continent={googleCar.continent} />
                  {googleCar.countryCode && <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium uppercase">{googleCar.countryCode}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Google Cars List View */}
      {viewMode === 'list' && filteredGoogleCars.length > 0 && (
        <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Continent</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGoogleCars.map((googleCar) => (
                <tr key={googleCar.id} onClick={() => setSelectedGoogleCar(googleCar)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {googleCar.imageUrl ? (
                      <img src={getImageUrl(googleCar.imageUrl)} alt={googleCar.name} className="h-16 w-16 object-cover rounded shadow-sm"
                           onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = '/images/googlecar-placeholder.png'; }} />
                    ) : (<div className="h-16 w-16 bg-gray-200 rounded"></div>)}
                  </td>
                  <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{googleCar.name}</div></td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{googleCar.country}{googleCar.countryCode && <span className="ml-1 text-xs text-gray-500">({googleCar.countryCode.toUpperCase()})</span>}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><ContinentBadge continent={googleCar.continent} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Info Card */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">What are Google Street View Cars?</h2>
        <p className="text-blue-700 mb-4">
          Google Street View cars are vehicles equipped with specialized camera systems used to capture the 360-degree panoramic images seen on Google Maps. 
          Different generations and variations of these cars (and sometimes trekkers, snowmobiles, etc.) have been used worldwide, and their appearance can sometimes be a clue in GeoGuessr.
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          {availableContinents.length > 0 && availableContinents.map(continent => (
            continent !== 'All Continents' &&
            <div key={continent} className="flex items-center">
              <div className={`h-4 w-4 rounded-full mr-2 ${
                continent === 'Africa' ? 'bg-yellow-500' : 
                continent === 'Asia' ? 'bg-red-500' : 
                continent === 'Europe' ? 'bg-blue-500' : 
                continent === 'North America' ? 'bg-green-500' : 
                continent === 'South America' ? 'bg-purple-500' : 
                continent === 'Oceania' ? 'bg-indigo-500' : 'bg-gray-500'
              }`}></div>
              <span className="text-sm text-gray-700">{continent}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Selected Google Car */}
      {selectedGoogleCar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setSelectedGoogleCar(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Google Car Details</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setSelectedGoogleCar(null)} aria-label="Close modal">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mb-4">
                <img src={getImageUrl(selectedGoogleCar.imageUrl)} alt={`Google Car in ${selectedGoogleCar.country}`} className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                     onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = '/images/googlecar-placeholder.png'; }} />
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedGoogleCar.description}</p>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Country</h4>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-50 p-2 rounded flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{selectedGoogleCar.country}</span>
                  </span>
                  <ContinentBadge continent={selectedGoogleCar.continent} />
                </div>
              </div>
              {selectedGoogleCar.googleMapsUrl && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Example Location</h4>
                  <a href={selectedGoogleCar.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    View on Google Maps
                  </a>
                </div>
              )}
              <div className="mt-6 text-center text-sm text-gray-500">Press ESC key or click outside to close</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCarsPage; 