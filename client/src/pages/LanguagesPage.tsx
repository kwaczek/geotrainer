import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
// Removed unused imports: LicensePlateGallery, LicensePlateType

// API Language interface as returned from the database
interface ApiLanguage {
  _id: string;
  imageUrl: string; // Image might represent text sample or script
  description: string; // Could be "Official language", "Common script", etc.
  countries: Array<{
    _id: string;
    name: string;
    code: string;
    continent: string;
  }>;
  country: string; // Country primarily associated (if applicable)
  countryCode: string;
  continent: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Display Language interface used in the UI
interface Language {
  id: string;
  name: string; // Name of the language or script
  country: string;
  countryCode: string;
  continent: string;
  imageUrl: string;
  description: string;
}

// Transform API language to display language
const transformLanguage = (language: ApiLanguage): Language => {
  console.log(`Transforming language data:`, language);
  
  // Use the direct country/continent properties from the server response
  // Modify name extraction if needed - using description for now
  return {
    id: language._id,
    name: language.description.split('.')[0].trim() || 'Language/Script', // Basic name extraction
    country: language.country || 'Unknown',
    countryCode: language.countryCode || 'unknown',
    continent: language.continent || 'Unknown',
    imageUrl: language.imageUrl,
    description: language.description
  };
};

// Keep continent mapping function (it's general)
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
  
  if (!code) {
    const lowerName = countryCode.toLowerCase();
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

// Fallback data for Languages
const fallbackLanguages: Language[] = [
  {
    id: 'lang-en',
    name: 'English Script',
    country: 'United Kingdom',
    countryCode: 'gb',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=English',
    description: 'Common Latin script used for English.'
  },
  {
    id: 'lang-es',
    name: 'Spanish Script',
    country: 'Spain',
    countryCode: 'es',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Español',
    description: 'Common Latin script used for Spanish, with specific characters like ñ.'
  },
  {
    id: 'lang-jp',
    name: 'Japanese Writing',
    country: 'Japan',
    countryCode: 'jp',
    continent: 'Asia',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=日本語',
    description: 'Japanese uses Hiragana, Katakana, and Kanji scripts.'
  },
  {
    id: 'lang-ru',
    name: 'Russian Script',
    country: 'Russia',
    countryCode: 'ru',
    continent: 'Europe', // or Asia, mapping is complex
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Русский',
    description: 'Russian uses the Cyrillic alphabet.'
  },
];

// Local storage keys
const LANGUAGES_FILTER_KEY = 'geotrainer_languages_filter'; // Changed key

// Default filter settings (kept the same structure)
const defaultFilterSettings = {
  searchTerm: '',
  country: 'All Countries',
  continent: 'All Continents',
  sortBy: 'name',
  viewMode: 'grid' as const
};

// Get stored settings or default values
const getStoredSettings = () => {
  const stored = localStorage.getItem(LANGUAGES_FILTER_KEY); // Use new key
  if (stored) {
    try {
      return { ...defaultFilterSettings, ...JSON.parse(stored) };
    } catch (e) {
      console.warn('Failed to parse stored language settings, using defaults');
      return defaultFilterSettings;
    }
  }
  return defaultFilterSettings;
};

// Keep ensureBasicContinents function (it's general)
const ensureBasicContinents = (continents: string[]): string[] => {
  const baseContinents = ['All Continents', 'Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'];
  baseContinents.forEach(continent => {
    if (!continents.includes(continent)) {
      continents.push(continent);
    }
  });
  return continents.sort((a, b) => {
    if (a === 'All Continents') return -1;
    if (b === 'All Continents') return 1;
    return a.localeCompare(b);
  });
};

const LanguagesPage: React.FC = () => { // Renamed component
  useDocumentTitle('Languages & Scripts', true); // Changed title
  const [languages, setLanguages] = useState<Language[]>([]); // Renamed state
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>([]); // Renamed state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState<boolean>(false);
  const [availableCountries, setAvailableCountries] = useState<{name: string, continent: string}[]>([]);
  const [availableContinents, setAvailableContinents] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null); // Renamed state
  
  // Initialize with values from localStorage or defaults
  const storedSettings = getStoredSettings();
  const [searchTerm, setSearchTerm] = useState<string>(storedSettings.searchTerm);
  const [selectedCountry, setSelectedCountry] = useState<string>(storedSettings.country);
  const [selectedContinent, setSelectedContinent] = useState<string>(storedSettings.continent);
  const [sortBy, setSortBy] = useState<string>(storedSettings.sortBy);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(storedSettings.viewMode);

  // Fetch languages and continents on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching languages from API...'); // Changed log
        
        // Fetch countries and continents first (assuming same logic applies)
        try {
          console.log('Fetching countries from API...');
          const countriesResponse = await axios.get('/api/countries');
          console.log('API countries response:', countriesResponse.data);
          
          if (countriesResponse.data && Array.isArray(countriesResponse.data)) {
            const countries = countriesResponse.data.map((country: any) => ({
              name: country.name,
              continent: country.continent || 'Unknown'
            })).sort((a: any, b: any) => a.name.localeCompare(b.name));
            setAvailableCountries(countries);
            console.log('Countries loaded from API:', countries.length);
            
            const continents = Array.from(
              new Set(countries.map((c: any) => c.continent || 'Unknown'))
            ).filter(Boolean).sort();
            if (!continents.includes('All Continents')) {
              setAvailableContinents(['All Continents', ...continents]);
            } else {
              setAvailableContinents(continents);
            }
            console.log('Continents derived from API countries:', continents);
          }
        } catch (err) {
          console.warn('Could not fetch countries from API:', err);
        }
        
        try {
          const continentsResponse = await axios.get('/api/countries/continents');
          console.log('API continents response:', continentsResponse.data);
          
          if (continentsResponse.data && continentsResponse.data.continents && 
              Array.isArray(continentsResponse.data.continents) && 
              continentsResponse.data.continents.length > 0) {
            const continentList = continentsResponse.data.continents;
            if (!continentList.includes('All Continents')) {
              const newContinents = ['All Continents', ...continentList];
              setAvailableContinents(newContinents);
            } else {
              setAvailableContinents(continentList);
            }
            console.log('Continents loaded from API:', continentsResponse.data.continents);
          }
        } catch (err) {
          console.warn('Could not fetch continents from API:', err);
        }
        
        // Fetch languages
        const languageResponse = await axios.get('/api/languages'); // Changed API endpoint
        console.log('Language API response received:', languageResponse.data);

        let transformedLanguages: Language[] = [];
        if (languageResponse.data && Array.isArray(languageResponse.data)) {
          console.log('Response is a direct array of languages');
          transformedLanguages = languageResponse.data.map(transformLanguage); // Use transformLanguage
          setLanguages(transformedLanguages); // Set languages state
          setUsingFallbackData(false);
          
          const unknownCount = transformedLanguages.filter(l => 
            l.continent === 'Unknown' || l.country === 'Unknown'
          ).length;
          if (unknownCount > 0) {
            console.warn(`${unknownCount} languages have Unknown values, but using API data anyway`);
          }
        } else {
          console.warn('Unexpected API response format, using fallback language data:', languageResponse.data);
          setLanguages(fallbackLanguages); // Use fallback languages
          setUsingFallbackData(true);
          transformedLanguages = fallbackLanguages;
        }
        
        // Fallback extraction logic (kept similar, uses transformedLanguages)
        if (availableCountries.length === 0) {
          console.log('Extracting countries from languages as fallback...');
          const uniqueCountries = Array.from(
            new Set(transformedLanguages.map(lang => lang.country))
          ).map(countryName => {
            const lang = transformedLanguages.find(l => l.country === countryName);
            return {
              name: countryName,
              continent: lang?.continent || 'Unknown'
            };
          }).sort((a, b) => a.name.localeCompare(b.name));
          console.log('Extracted countries from languages:', uniqueCountries.length);
          setAvailableCountries(uniqueCountries);
        }
        
        if (availableContinents.length === 0) {
          console.log('Extracting continents from languages as fallback...');
          const uniqueContinents = Array.from(
            new Set(transformedLanguages.map(lang => lang.continent))
          ).filter(Boolean).sort();
          if (!uniqueContinents.includes('All Continents')) {
            uniqueContinents.unshift('All Continents');
          }
          const finalContinents = ensureBasicContinents(uniqueContinents);
          console.log('Extracted continents from languages with fallbacks:', finalContinents);
          setAvailableContinents(finalContinents);
        } else {
          setAvailableContinents(ensureBasicContinents([...availableContinents]));
        }
        
        // Debugging logs (updated for languages)
        try {
          console.log('=== LANGUAGE DATA LOADING RESULTS ===');
          console.log('Total languages loaded:', transformedLanguages.length);
          console.log('Sample language data:', transformedLanguages.length > 0 ? transformedLanguages[0] : 'None');
          console.log('Sample language continent:', transformedLanguages.length > 0 ? transformedLanguages[0].continent : 'None');
          console.log('Total countries loaded:', availableCountries.length);
          console.log('Available countries:', availableCountries.map(c => c.name).join(', '));
          console.log('Total continents loaded:', availableContinents.length);
          console.log('Available continents:', availableContinents.join(', '));
          const continentsInData = Array.from(new Set(transformedLanguages.map(p => p.continent)));
          console.log('Continents in transformed language data:', continentsInData.join(', '));
          if (availableContinents.length > 0 && continentsInData.length > 0) {
            const mismatch = continentsInData.filter(c => c !== 'All Continents' && !availableContinents.includes(c));
            if (mismatch.length > 0) {
              console.warn('LANGUAGE CONTINENT MISMATCH DETECTED:', mismatch);
            }
          }
          console.log('=== END LANGUAGE DATA LOADING RESULTS ===');
        } catch (error) {
          console.error('Error in language debugging section:', error);
        }
        
      } catch (error) {
        console.error('Error fetching languages:', error); // Changed log
        console.warn('Using fallback language data due to connection error'); // Changed log
        setLanguages(fallbackLanguages); // Use fallback languages
        setUsingFallbackData(true);
        
        // Fallback extraction (kept similar, uses fallbackLanguages)
        if (availableCountries.length === 0) {
          const uniqueCountries = Array.from(
            new Set(fallbackLanguages.map(lang => lang.country))
          ).map(countryName => {
            const lang = fallbackLanguages.find(l => l.country === countryName);
            return {
              name: countryName,
              continent: lang?.continent || 'Unknown'
            };
          }).sort((a, b) => a.name.localeCompare(b.name));
          console.log('Using fallback countries:', uniqueCountries.length);
          setAvailableCountries(uniqueCountries);
        }
        
        if (availableContinents.length === 0) {
          const uniqueContinents = Array.from(
            new Set(fallbackLanguages.map(lang => lang.continent))
          ).filter(Boolean).sort();
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

  // Save filter settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      searchTerm,
      country: selectedCountry,
      continent: selectedContinent,
      sortBy,
      viewMode
    };
    localStorage.setItem(LANGUAGES_FILTER_KEY, JSON.stringify(settings)); // Use new key
  }, [searchTerm, selectedCountry, selectedContinent, sortBy, viewMode]);

  // Keep ContinentBadge (it's general)
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
        case 'Unknown': return 'bg-gray-200 text-gray-500';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getContinentColor()}`}>
        {continent}
      </span>
    );
  };

  // Reset all filters (same logic)
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCountry('All Countries');
    setSelectedContinent('All Continents');
  };

  // Get unique countries and continents for the filters (uses languages state now)
  const countries = Array.from(new Set(languages.map(lang => lang.country))).sort();
  const continents = Array.from(new Set(languages.map(lang => lang.continent))).sort();

  // Handle country filter change (same logic)
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
  };

  // Handle continent filter change (same logic)
  const handleContinentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedContinent(e.target.value);
  };

  // Handle view mode toggle (same logic)
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  // Apply filters, search, and sort when dependencies change (updated for languages)
  useEffect(() => {
    console.log('Starting language filtering with:', { // Changed log
      totalLanguages: languages.length,
      countryFilter: selectedCountry,
      continentFilter: selectedContinent,
      searchTerm: searchTerm
    });
    
    let result = [...languages];

    // Apply country filter
    if (selectedCountry !== 'All Countries') {
      result = result.filter(lang => lang.country === selectedCountry);
      console.log(`After country filter (${selectedCountry}):`, result.length);
    }

    // Apply continent filter
    if (selectedContinent !== 'All Continents') {
      const uniqueContinents = Array.from(new Set(languages.map(l => l.continent)));
      console.log('Available continent values in language data:', uniqueContinents);
      result = result.filter(lang => {
        const matchesContinent = 
          lang.continent.toLowerCase() === selectedContinent.toLowerCase() ||
          lang.continent.toLowerCase().replace(/[_\s-]/g, '') === selectedContinent.toLowerCase().replace(/[_\s-]/g, '');
        if (!matchesContinent && lang.continent !== 'Unknown') {
          console.log(`No match: Language continent "${lang.continent}" doesn't match filter "${selectedContinent}"`);
        }
        return matchesContinent;
      });
      console.log(`After continent filter (${selectedContinent}):`, result.length);
      if (result.length === 0) {
        console.log('Continent filter returned no language results. Available continents in data:',
          Array.from(new Set(languages.map(l => l.continent))).join(', '));
      }
    }

    // Apply search (searching name, country, description)
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(lang => 
        lang.name.toLowerCase().includes(searchLower) || 
        lang.country.toLowerCase().includes(searchLower) ||
        lang.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting (same fields: name, country, continent)
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

    setFilteredLanguages(result); // Set filtered languages state
  }, [languages, selectedCountry, selectedContinent, searchTerm, sortBy]);

  // Handle search input change (same logic)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort change (same logic)
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  // Debugging effect (updated for languages)
  useEffect(() => {
    console.log('=== LANGUAGE FILTER STATE ===');
    console.log('Selected country:', selectedCountry);
    console.log('Selected continent:', selectedContinent);
    console.log('Current filtered languages count:', filteredLanguages.length);
    if (filteredLanguages.length > 0) {
      console.log('First filtered language:', filteredLanguages[0]);
      console.log('Sample continents in filtered language data:', filteredLanguages.slice(0, 5).map(l => l.continent).join(', '));
    }
    console.log('=== END LANGUAGE FILTER STATE ===');
  }, [filteredLanguages, selectedCountry, selectedContinent]);

  // Keyboard support for ESC key (uses selectedLanguage now)
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedLanguage) {
        setSelectedLanguage(null);
      }
    };
    if (selectedLanguage) {
      document.addEventListener('keydown', handleEscKey);
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedLanguage]);

  // Loading state (changed text)
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading languages...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Languages & Scripts of the World</h1> {/* Changed title */}
      
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
                Database connection unavailable. Showing sample language/script data for demonstration purposes. {/* Changed text */}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Filter section (kept the same structure, placeholders updated) */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search by language, country, or description..." // Changed placeholder
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
              {availableContinents.map(continent => (
                <option key={continent} value={continent}>{continent}</option>
              ))}
            </select>
          </div>

          {/* Sorting and View Controls (same logic) */}
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
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>List
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>Grid
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Reset Filters Button (same logic) */}
        {(selectedCountry !== 'All Countries' || selectedContinent !== 'All Continents' || searchTerm !== '') && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Results count (updated for languages) */}
      <div className="mb-6 text-gray-600">
        <p>Showing {filteredLanguages.length} of {languages.length} languages/scripts</p>
      </div>

      {/* No results message (updated for languages) */}
      {filteredLanguages.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No languages found</h3>
          <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
          <button
            onClick={resetFilters}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Languages Grid View (updated for languages) */}
      {viewMode === 'grid' && filteredLanguages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredLanguages.map(lang => (
            <div 
              key={lang.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              onClick={() => setSelectedLanguage(lang)} // Use setSelectedLanguage
            >
              {lang.imageUrl && (
                <div className="h-48 bg-gray-100">
                  <img 
                    src={lang.imageUrl} 
                    alt={`${lang.name} script/text sample`} // Changed alt text
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/language-placeholder.png'; // Changed placeholder
                    }}
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{lang.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Country:</span> {lang.country}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <ContinentBadge continent={lang.continent} />
                  {lang.countryCode && (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium uppercase">
                      {lang.countryCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Languages List View (updated for languages) */}
      {viewMode === 'list' && filteredLanguages.length > 0 && (
        <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Continent</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLanguages.map(lang => (
                <tr 
                  key={lang.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedLanguage(lang)} // Use setSelectedLanguage
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lang.imageUrl ? (
                      <img 
                        src={lang.imageUrl} 
                        alt={lang.name}
                        className="h-16 w-16 object-cover rounded shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/images/language-placeholder.png'; // Changed placeholder
                        }}
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded"></div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{lang.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{lang.country}</div>
                    {lang.countryCode && (
                      <div className="text-xs text-gray-500 uppercase">{lang.countryCode}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ContinentBadge continent={lang.continent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Card (updated for languages) */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">What are Languages and Scripts?</h2>
        <p className="text-blue-700 mb-4">
          Languages are systems of communication, while scripts are the writing systems used to represent them visually.
          Different countries and regions use diverse languages and scripts, which can be important clues in geographic identification.
          Recognizing scripts like Cyrillic, Greek, Arabic, or specific Latin variations can help narrow down locations.
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

      {/* Language Details Modal (updated for languages) */}
      {selectedLanguage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setSelectedLanguage(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Language/Script Details</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedLanguage(null)}
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="mb-4">
                <img 
                  src={selectedLanguage.imageUrl} 
                  alt={`Sample of ${selectedLanguage.name} in ${selectedLanguage.country}`} // Changed alt text
                  className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/images/language-placeholder.png'; // Changed placeholder
                  }}
                />
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedLanguage.description}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Country Association</h4>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-50 p-2 rounded flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{selectedLanguage.country}</span>
                  </span>
                  <ContinentBadge continent={selectedLanguage.continent} />
                </div>
              </div>
              
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

export default LanguagesPage; // Changed export name 