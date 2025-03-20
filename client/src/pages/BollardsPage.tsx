import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import BollardGallery from '../components/BollardGallery';

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

// Define FilterSettings type at the top with other interfaces
interface FilterSettings {
  searchTerm: string;
  country: string;
  continent: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
}

// Transform API bollard to display bollard
const transformBollard = (bollard: ApiBollard): Bollard => {
  const country = bollard.countries && bollard.countries.length > 0 ? bollard.countries[0] : null;
  
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
    console.log(`Got continent ${continent} directly from country object for ${country.name}`);
  } else {
    // If not available, try to determine from country code
    continent = getContinent(country?.code || '');
    console.log(`Determined continent ${continent} from code for ${country?.name}`);
  }
  
  return {
    id: bollard._id,
    name: bollard.description.split('.')[0].trim(), // Use first sentence as name
    country: country?.name || 'Unknown',
    countryCode: country?.code || '',
    continent: continent,
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

// Find and replace the localStorage key to match what's being used
const STORAGE_KEY = 'geotrainer_bollards_filter';

// Default filter settings
const defaultFilterSettings = {
  searchTerm: '',
  country: 'All Countries',
  continent: 'All Continents',
  sortBy: 'name',
  viewMode: 'grid' as const
};

// Utility functions for localStorage
const saveSettingsToStorage = (settings: FilterSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    console.log('Settings saved to localStorage:', settings);
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
};

const getStoredSettings = (): FilterSettings => {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (storedSettings) {
      console.log('Retrieved settings from localStorage:', storedSettings);
      return JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error('Error retrieving settings from localStorage:', error);
  }
  
  // Default settings if nothing in localStorage or error occurs
  return defaultFilterSettings;
};

const BollardsPage: React.FC = () => {
  useDocumentTitle('Bollards', true);
  const [bollards, setBollards] = useState<Bollard[]>([]);
  const [filteredBollards, setFilteredBollards] = useState<Bollard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState<{name: string, continent: string}[]>([]);
  const [availableContinents, setAvailableContinents] = useState<string[]>([]);
  const [selectedBollard, setSelectedBollard] = useState<Bollard | null>(null);
  
  // Initialize with values from localStorage or defaults
  const storedSettings = getStoredSettings();
  console.log('Using stored settings:', storedSettings);

  const [searchTerm, setSearchTerm] = useState<string>(storedSettings.searchTerm || '');
  const [selectedCountry, setSelectedCountry] = useState<string>(storedSettings.country || 'All Countries');
  const [selectedContinent, setSelectedContinent] = useState<string>(storedSettings.continent || 'All Continents');
  const [sortBy, setSortBy] = useState<string>(storedSettings.sortBy || 'country');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(storedSettings.viewMode || 'grid');
  const [usingFallbackData, setUsingFallbackData] = useState<boolean>(false);
  
  // Initialize app and force filter reset
  useEffect(() => {
    console.log('App initialized, using filters from localStorage');
    console.log('Currently selected country:', selectedCountry);
    console.log('Currently selected continent:', selectedContinent);
  }, []);

  // Debugger effect - trace what happens to state
  useEffect(() => {
    console.log('=== Debug State ===');
    console.log('Bollards count:', bollards.length);
    console.log('First bollard:', bollards.length > 0 ? bollards[0] : 'none');
    console.log('Filtered bollards count:', filteredBollards.length);
    console.log('Selected country:', selectedCountry);
    console.log('Selected continent:', selectedContinent);
    console.log('Available continents:', availableContinents);
    console.log('Available countries:', availableCountries.length);
    console.log('=== End Debug ===');
  }, [bollards, filteredBollards, selectedCountry, selectedContinent, availableContinents, availableCountries]);

  // Update the fetchData function to force "All Continents" as the initial selection
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data from API...');
        
        // Remove forced filter reset
        // We're now preserving the filters from localStorage
        
        // Fetch countries and continents first
        try {
          console.log('Fetching countries and continents...');
          const countriesResponse = await axios.get('/api/countries');
          console.log('API countries response:', countriesResponse.data);
          
          if (countriesResponse.data && Array.isArray(countriesResponse.data)) {
            const countries = countriesResponse.data.map((country: any) => ({
              name: country.name,
              continent: country.continent || 'Unknown'
            })).sort((a: any, b: any) => a.name.localeCompare(b.name));
            
            setAvailableCountries(countries);
            console.log('Countries loaded from API:', countries.length);
            
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
            console.log('Continents derived from API countries:', continents);
          }
        } catch (err) {
          console.warn('Could not fetch countries from API:', err);
          // Will fallback to extracting from bollards
        }
        
        // Also try to get continents separately for more reliable data
        try {
          const continentsResponse = await axios.get('/api/countries/continents');
          console.log('API continents response:', continentsResponse.data);
          
          if (continentsResponse.data && continentsResponse.data.continents && 
              Array.isArray(continentsResponse.data.continents) && 
              continentsResponse.data.continents.length > 0) {
            const continentList = continentsResponse.data.continents;
            // Check if All Continents is already in the list
            if (!continentList.includes('All Continents')) {
              // Preserve user's selected continent but ensure All Continents is an option
              const newContinents = ['All Continents', ...continentList];
              setAvailableContinents(newContinents);
              console.log('Setting available continents with All Continents added:', newContinents);
            } else {
              setAvailableContinents(continentList);
              console.log('Setting available continents as provided by API:', continentList);
            }
            console.log('Continents loaded from API:', continentsResponse.data.continents);
          }
        } catch (err) {
          console.warn('Could not fetch continents from API:', err);
          // Will fallback to extracting from bollards or countries
        }
        
        // Now fetch bollards
        const bollardResponse = await axios.get('/api/bollards');
        console.log('API bollards response received:', bollardResponse.data);
        
        // If we got a response and it's an array, process it
        let transformedBollards: Bollard[] = [];
        if (bollardResponse.data && Array.isArray(bollardResponse.data)) {
          console.log('Response is a direct array of bollards with length:', bollardResponse.data.length);
          transformedBollards = bollardResponse.data.map(transformBollard);
          console.log('Transformed bollards:', transformedBollards.length);
          console.log('First transformed bollard:', transformedBollards.length > 0 ? transformedBollards[0] : 'none');
          setBollards(transformedBollards);
          setUsingFallbackData(false);
        }
        // If the response has a bollards property that's an array
        else if (bollardResponse.data && bollardResponse.data.bollards && Array.isArray(bollardResponse.data.bollards)) {
          console.log('Response has bollards array in data property');
          transformedBollards = bollardResponse.data.bollards.map(transformBollard);
          console.log('Transformed bollards:', transformedBollards.length);
          setBollards(transformedBollards);
          setUsingFallbackData(false);
        }
        // If none of the above formats match, use fallback
        else {
          console.warn('Unexpected API response format, using fallback data:', bollardResponse.data);
          setBollards(fallbackBollards);
          setUsingFallbackData(true);
          transformedBollards = fallbackBollards;
        }
        
        // Log the result of state update
        console.log('Total bollards loaded:', transformedBollards.length);

        // If we couldn't get countries from API, extract them from bollards as fallback
        if (availableCountries.length === 0) {
          console.log('Extracting countries from bollards as fallback...');
          const uniqueCountries = Array.from(
            new Set(transformedBollards.map(bollard => bollard.country))
          ).map(countryName => {
            const bollard = transformedBollards.find(b => b.country === countryName);
            return {
              name: countryName,
              continent: bollard?.continent || 'Unknown'
            };
          }).sort((a, b) => a.name.localeCompare(b.name));
          
          console.log('Extracted countries from bollards:', uniqueCountries.length);
          setAvailableCountries(uniqueCountries);
        }
        
        // If we couldn't get continents from API, extract them from bollards as fallback
        if (availableContinents.length === 0) {
          console.log('Extracting continents from bollards as fallback...');
          const uniqueContinents = Array.from(
            new Set(transformedBollards.map(bollard => bollard.continent))
          ).filter(Boolean).sort();
          
          // Add 'All Continents' if not already present
          if (!uniqueContinents.includes('All Continents')) {
            uniqueContinents.unshift('All Continents');
          }
          
          console.log('Extracted continents from bollards:', uniqueContinents);
          setAvailableContinents(uniqueContinents);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        console.warn('Using fallback data due to connection error');
        setBollards(fallbackBollards);
        setUsingFallbackData(true);
        
        // Extract unique countries and continents from fallback data if needed
        if (availableCountries.length === 0) {
          const uniqueCountries = Array.from(
            new Set(fallbackBollards.map(bollard => bollard.country))
          ).map(countryName => {
            const bollard = fallbackBollards.find(b => b.country === countryName);
            return {
              name: countryName,
              continent: bollard?.continent || 'Unknown'
            };
          }).sort((a, b) => a.name.localeCompare(b.name));
          
          console.log('Using fallback countries:', uniqueCountries.length);
          setAvailableCountries(uniqueCountries);
        }
        
        // Extract unique continents from fallback if needed
        if (availableContinents.length === 0) {
          const uniqueContinents = Array.from(
            new Set(fallbackBollards.map(bollard => bollard.continent))
          ).filter(Boolean).sort();
          
          // Add 'All Continents' if not already present
          if (!uniqueContinents.includes('All Continents')) {
            uniqueContinents.unshift('All Continents');
          }
          
          console.log('Using fallback continents:', uniqueContinents);
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

  // Remove or modify the initialization effect that was forcibly resetting filters
  // Instead, we'll check if we need to update the filters when availableCountries or availableContinents change
  useEffect(() => {
    // Only set default filters if the selected values don't exist in the available options
    // This prevents invalid filters while preserving user selections
    if (availableCountries.length > 0 && selectedCountry !== 'All Countries') {
      const countryExists = availableCountries.some(c => c.name === selectedCountry);
      if (!countryExists) {
        console.log('Selected country not found in available countries, resetting to All Countries');
        setSelectedCountry('All Countries');
      }
    }
    
    if (availableContinents.length > 0 && selectedContinent !== 'All Continents') {
      const continentExists = availableContinents.includes(selectedContinent);
      if (!continentExists) {
        console.log('Selected continent not found in available continents, resetting to All Continents');
        setSelectedContinent('All Continents');
      }
    }
  }, [availableCountries, availableContinents, selectedCountry, selectedContinent]);

  // Update the filtering logic
  useEffect(() => {
    console.log('Filtering bollards...');
    console.log('Total bollards:', bollards.length);
    console.log('Selected country:', selectedCountry);
    console.log('Selected continent:', selectedContinent);
    
    let result = [...bollards];
    console.log('Initial result count:', result.length);

    // Don't filter if we have the "All Continents" selected, as that's the default
    if (selectedContinent && selectedContinent !== 'All Continents') {
      console.log('Filtering by continent:', selectedContinent);
      result = result.filter(bollard => {
        const match = bollard.continent === selectedContinent;
        if (!match) {
          console.log('  Excluding bollard:', bollard.name, 'with continent:', bollard.continent);
        }
        return match;
      });
      console.log('After continent filter:', result.length);
    } else {
      console.log('No continent filtering applied');
    }

    // Don't filter if we have "All Countries" selected
    if (selectedCountry && selectedCountry !== 'All Countries') {
      console.log('Filtering by country:', selectedCountry);
      result = result.filter(bollard => {
        const match = bollard.country === selectedCountry;
        if (!match) {
          console.log('  Excluding bollard:', bollard.name, 'with country:', bollard.country);
        }
        return match;
      });
      console.log('After country filter:', result.length);
    } else {
      console.log('No country filtering applied');
    }

    // Apply search
    if (searchTerm.trim() !== '') {
      console.log('Filtering by search term:', searchTerm);
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(bollard => 
        bollard.name.toLowerCase().includes(searchLower) || 
        bollard.country.toLowerCase().includes(searchLower) ||
        bollard.description.toLowerCase().includes(searchLower)
      );
      console.log('After search filter:', result.length);
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

    console.log('Final filtered count:', result.length);
    setFilteredBollards(result);
  }, [bollards, selectedCountry, selectedContinent, searchTerm, sortBy]);

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
    console.log('Filter reset requested');
    setSearchTerm('');
    setSelectedCountry('All Countries');
    setSelectedContinent('All Continents');
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

  // Add effect for keyboard support
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedBollard) {
        setSelectedBollard(null);
      }
    };

    // Add event listener when modal is open
    if (selectedBollard) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedBollard]);

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
              <option value="All Countries">All Countries</option>
              {availableCountries.map(country => (
                <option key={country.name} value={country.name}>{country.name}</option>
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
              <option value="All Continents">All Continents</option>
              {availableContinents
                .filter(c => c !== 'All Continents') // Filter out "All Continents" since we explicitly add it above
                .map(continent => (
                  <option key={continent} value={continent}>{continent}</option>
                ))
              }
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
        {(selectedCountry !== 'All Countries' || selectedContinent !== 'All Continents' || searchTerm !== '') && (
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
            <div 
              key={bollard.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              onClick={() => setSelectedBollard(bollard)}
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
            </div>
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
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Continent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBollards.map((bollard) => (
                <tr 
                  key={bollard.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedBollard(bollard)}
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
                    <div className="text-sm text-gray-900">
                      {bollard.country}
                      {bollard.countryCode && (
                        <span className="ml-1 text-xs text-gray-500">({bollard.countryCode.toUpperCase()})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ContinentBadge continent={bollard.continent} />
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
          {availableContinents.length > 0 && availableContinents.map(continent => (
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

      {/* Add BollardGallery Modal */}
      {selectedBollard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setSelectedBollard(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Bollard Details</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedBollard(null)}
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <img 
                  src={selectedBollard.imageUrl} 
                  alt={`Bollard in ${selectedBollard.country}`}
                  className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/images/bollard-placeholder.png';
                  }}
                />
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedBollard.description}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Country</h4>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-50 p-2 rounded flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{selectedBollard.country}</span>
                  </span>
                  <ContinentBadge continent={selectedBollard.continent} />
                </div>
              </div>
              
              {selectedBollard.googleMapsUrl && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Location</h4>
                  <a 
                    href={selectedBollard.googleMapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View on Google Maps
                  </a>
                </div>
              )}
              
              <div className="mt-6 text-center text-sm text-gray-500">
                Press ESC key or click outside to close
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BollardsPage; 