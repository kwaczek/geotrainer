import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import LicensePlateGallery from '../components/LicensePlateGallery';
import { LicensePlate as LicensePlateType } from '../services/countryService';

// API Plate interface as returned from the database
interface ApiPlate {
  _id: string;
  imageUrl: string;
  description: string;
  countries: Array<{
    _id: string;
    name: string;
    code: string;
    continent: string;
  }>;
  country: string;
  countryCode: string;
  continent: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Display Plate interface used in the UI
interface Plate {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  continent: string;
  imageUrl: string;
  description: string;
}

// Transform API plate to display plate
const transformPlate = (plate: ApiPlate): Plate => {
  // Log the plate data
  console.log(`Transforming plate data:`, plate);
  
  // Use the direct country/continent properties from the server response
  return {
    id: plate._id,
    name: plate.description.split('.')[0].trim(),
    country: plate.country || 'Unknown',
    countryCode: plate.countryCode || 'unknown',
    continent: plate.continent || 'Unknown',
    imageUrl: plate.imageUrl,
    description: plate.description
  };
};

// Define the continent mapping function to ensure data consistency
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
  
  // Fallback mapping for country names
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

// Add a test for getContinent to see if it works
console.log('Testing getContinent function:');
console.log('US maps to:', getContinent('us'));
console.log('DE maps to:', getContinent('de'));
console.log('JP maps to:', getContinent('jp'));
console.log('Unknown maps to:', getContinent(''));

// Fallback data if database connection fails
const fallbackPlates: Plate[] = [
  {
    id: 'us-plate',
    name: 'US License Plate',
    country: 'United States',
    countryCode: 'us',
    continent: 'North America',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=US+Plate',
    description: 'Standard US license plate design with state identification.'
  },
  {
    id: 'de-plate',
    name: 'German License Plate',
    country: 'Germany',
    countryCode: 'de',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=German+Plate',
    description: 'Standard German license plate design with regional identifiers.'
  },
  {
    id: 'jp-plate',
    name: 'Japanese License Plate',
    country: 'Japan',
    countryCode: 'jp',
    continent: 'Asia',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Japan+Plate',
    description: 'Japanese license plate with prefecture designation and classification numbers.'
  },
  {
    id: 'za-plate',
    name: 'South African License Plate',
    country: 'South Africa',
    countryCode: 'za',
    continent: 'Africa',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=SA+Plate',
    description: 'South African license plate with provincial identifiers and registration numbers.'
  },
  {
    id: 'au-plate',
    name: 'Australian License Plate',
    country: 'Australia',
    countryCode: 'au',
    continent: 'Oceania',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=AU+Plate',
    description: 'Australian license plate with state/territory markings and unique identification.'
  },
  {
    id: 'br-plate',
    name: 'Brazilian License Plate',
    country: 'Brazil',
    countryCode: 'br',
    continent: 'South America',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=BR+Plate',
    description: 'Brazilian license plate with Mercosur standard format and state identifiers.'
  },
  // Additional European plates matching screenshot data
  {
    id: 'ad-plate',
    name: 'Andorran License Plate',
    country: 'Andorra',
    countryCode: 'ad',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Andorra+Plate',
    description: 'Andorran licence plates have an orange dot on the left side and can be regularly found throughout the country.'
  },
  {
    id: 'it-plate',
    name: 'Italian License Plate',
    country: 'Italy',
    countryCode: 'it',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Italy+Plate',
    description: 'Contrary to most European licence plates, Italian plates have blue strips on either side of the plate.'
  },
  {
    id: 'is-plate',
    name: 'Icelandic License Plate',
    country: 'Iceland',
    countryCode: 'is',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Iceland+Plate',
    description: 'Icelandic licence plates are fully white with blue characters.'
  },
  {
    id: 'ie-plate',
    name: 'Irish License Plate',
    country: 'Ireland',
    countryCode: 'ie',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Ireland+Plate',
    description: 'Ireland has long, white licence plates with the standard European blue strip on the left.'
  },
  {
    id: 'be-plate',
    name: 'Belgian License Plate',
    country: 'Belgium',
    countryCode: 'be',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Belgium+Plate',
    description: 'Licence plates in Belgium use red text.'
  },
  {
    id: 'mt-plate',
    name: 'Maltese License Plate',
    country: 'Malta', 
    countryCode: 'mt',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=Malta+Plate',
    description: 'Like most of Europe, Maltese licence plates have a blue strip on the left.'
  },
  {
    id: 'fr-plate',
    name: 'French License Plate',
    country: 'France',
    countryCode: 'fr',
    continent: 'Europe',
    imageUrl: 'https://placehold.co/300x400/e2e8f0/1e40af?text=France+Plate',
    description: 'Modern French plates are long and white, with blue strips on both sides of the plate.'
  }
];

// Local storage keys
const PLATES_FILTER_KEY = 'geotrainer_plates_filter';

// Default filter settings
const defaultFilterSettings = {
  searchTerm: '',
  country: 'All Countries',
  continent: 'All Continents',
  sortBy: 'name',
  viewMode: 'grid' as const
};

// Get stored settings or default values
const getStoredSettings = () => {
  const stored = localStorage.getItem(PLATES_FILTER_KEY);
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

// Ensure these are always in the dropdown even if API fails
const ensureBasicContinents = (continents: string[]): string[] => {
  const baseContinents = ['All Continents', 'Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'];
  
  // Make sure all base continents are included
  baseContinents.forEach(continent => {
    if (!continents.includes(continent)) {
      continents.push(continent);
    }
  });
  
  // Sort them (keeping All Continents at top)
  return continents.sort((a, b) => {
    if (a === 'All Continents') return -1;
    if (b === 'All Continents') return 1;
    return a.localeCompare(b);
  });
};

const PlatesPage: React.FC = () => {
  useDocumentTitle('License Plates', true);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [filteredPlates, setFilteredPlates] = useState<Plate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState<boolean>(false);
  const [availableCountries, setAvailableCountries] = useState<{name: string, continent: string}[]>([]);
  const [availableContinents, setAvailableContinents] = useState<string[]>([]);
  const [selectedPlate, setSelectedPlate] = useState<Plate | null>(null);
  
  // Initialize with values from localStorage or defaults
  const storedSettings = getStoredSettings();
  const [searchTerm, setSearchTerm] = useState<string>(storedSettings.searchTerm);
  const [selectedCountry, setSelectedCountry] = useState<string>(storedSettings.country);
  const [selectedContinent, setSelectedContinent] = useState<string>(storedSettings.continent);
  const [sortBy, setSortBy] = useState<string>(storedSettings.sortBy);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(storedSettings.viewMode);

  // Fetch plates and continents on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching plates from API...');
        
        // Fetch countries and continents first
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
          // Will fallback to extracting from plates
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
          // Will fallback to extracting from plates or countries
        }
        
        // Fetch plates
        const plateResponse = await axios.get('/api/licenseplates');
        console.log('API response received:', plateResponse.data);

        // If we got a response and it's an array, process it
        let transformedPlates: Plate[] = [];
        if (plateResponse.data && Array.isArray(plateResponse.data)) {
          console.log('Response is a direct array of plates');
          // Transform the plates to match our display format
          transformedPlates = plateResponse.data.map(transformPlate);
          
          // Don't use fallback data just because some plates have unknown values
          // The line below checks for unknown values and uses fallback data - this is causing the issue
          // const hasUnknownContinents = transformedPlates.some(plate => 
          //   plate.continent === 'Unknown' || plate.country === 'Unknown'
          // );
          
          // Instead, always use the API data if the API response is valid
          setPlates(transformedPlates);
          setUsingFallbackData(false);
          
          // Log how many plates have unknown values - for debugging
          const unknownCount = transformedPlates.filter(p => 
            p.continent === 'Unknown' || p.country === 'Unknown'
          ).length;
          
          if (unknownCount > 0) {
            console.warn(`${unknownCount} plates have Unknown values, but using API data anyway`);
          }
        } else {
          console.warn('Unexpected API response format, using fallback data:', plateResponse.data);
          setPlates(fallbackPlates);
          setUsingFallbackData(true);
          transformedPlates = fallbackPlates;
        }
        
        // If we couldn't get countries from API, extract them from plates as fallback
        if (availableCountries.length === 0) {
          console.log('Extracting countries from plates as fallback...');
          const uniqueCountries = Array.from(
            new Set(transformedPlates.map(plate => plate.country))
          ).map(countryName => {
            const plate = transformedPlates.find(p => p.country === countryName);
            return {
              name: countryName,
              continent: plate?.continent || 'Unknown'
            };
          }).sort((a, b) => a.name.localeCompare(b.name));
          
          console.log('Extracted countries from plates:', uniqueCountries.length);
          setAvailableCountries(uniqueCountries);
        }
        
        // If we couldn't get continents from API, extract them from plates as fallback
        if (availableContinents.length === 0) {
          console.log('Extracting continents from plates as fallback...');
          const uniqueContinents = Array.from(
            new Set(transformedPlates.map(plate => plate.continent))
          ).filter(Boolean).sort();
          
          // Add 'All Continents' if not already present
          if (!uniqueContinents.includes('All Continents')) {
            uniqueContinents.unshift('All Continents');
          }
          
          // Make sure basic continents are included
          const finalContinents = ensureBasicContinents(uniqueContinents);
          
          console.log('Extracted continents from plates with fallbacks:', finalContinents);
          setAvailableContinents(finalContinents);
        } else {
          // Make sure basic continents are included in API result too
          setAvailableContinents(ensureBasicContinents([...availableContinents]));
        }
        
        // After loading all data and before finishing, add this debugging code
        try {
          console.log('=== DATA LOADING RESULTS ===');
          console.log('Total plates loaded:', transformedPlates.length);
          console.log('Sample plate data:', transformedPlates.length > 0 ? transformedPlates[0] : 'None');
          console.log('Sample plate continent:', transformedPlates.length > 0 ? transformedPlates[0].continent : 'None');
          console.log('Total countries loaded:', availableCountries.length);
          console.log('Available countries:', availableCountries.map(c => c.name).join(', '));
          console.log('Total continents loaded:', availableContinents.length);
          console.log('Available continents:', availableContinents.join(', '));
          
          // Analyze continents in transformed plates
          const continentsInData = Array.from(new Set(transformedPlates.map(p => p.continent)));
          console.log('Continents in transformed data:', continentsInData.join(', '));
          
          // Check if continents match between data and filters
          if (availableContinents.length > 0 && continentsInData.length > 0) {
            const mismatch = continentsInData.filter(c => c !== 'All Continents' && !availableContinents.includes(c));
            if (mismatch.length > 0) {
              console.warn('CONTINENT MISMATCH DETECTED: These continents in data do not match available filter options:', mismatch);
            }
          }
          console.log('=== END DATA LOADING RESULTS ===');
        } catch (error) {
          console.error('Error in debugging section:', error);
        }
        
      } catch (error) {
        console.error('Error fetching plates:', error);
        console.warn('Using fallback plate data due to connection error');
        setPlates(fallbackPlates);
        setUsingFallbackData(true);
        
        // Extract unique countries and continents from fallback data if needed
        if (availableCountries.length === 0) {
          const uniqueCountries = Array.from(
            new Set(fallbackPlates.map(plate => plate.country))
          ).map(countryName => {
            const plate = fallbackPlates.find(p => p.country === countryName);
            return {
              name: countryName,
              continent: plate?.continent || 'Unknown'
            };
          }).sort((a, b) => a.name.localeCompare(b.name));
          
          console.log('Using fallback countries:', uniqueCountries.length);
          setAvailableCountries(uniqueCountries);
        }
        
        // Extract unique continents from fallback if needed
        if (availableContinents.length === 0) {
          const uniqueContinents = Array.from(
            new Set(fallbackPlates.map(plate => plate.continent))
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

  // Save filter settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      searchTerm,
      country: selectedCountry,
      continent: selectedContinent,
      sortBy,
      viewMode
    };
    localStorage.setItem(PLATES_FILTER_KEY, JSON.stringify(settings));
  }, [searchTerm, selectedCountry, selectedContinent, sortBy, viewMode]);

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

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCountry('All Countries');
    setSelectedContinent('All Continents');
    // Don't reset sort or view mode on filter reset
  };

  // Get unique countries and continents for the filters
  const countries = Array.from(new Set(plates.map(plate => plate.country))).sort();
  const continents = Array.from(new Set(plates.map(plate => plate.continent))).sort();

  // Handle country filter change
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
  };

  // Handle continent filter change
  const handleContinentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedContinent(e.target.value);
  };

  // Handle view mode toggle
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  // Apply filters, search, and sort when dependencies change
  useEffect(() => {
    console.log('Starting filtering with:', {
      totalPlates: plates.length,
      countryFilter: selectedCountry,
      continentFilter: selectedContinent,
      searchTerm: searchTerm
    });
    
    let result = [...plates];

    // Apply country filter
    if (selectedCountry !== 'All Countries') {
      result = result.filter(plate => plate.country === selectedCountry);
      console.log(`After country filter (${selectedCountry}):`, result.length);
    }

    // Apply continent filter with case-insensitive matching
    if (selectedContinent !== 'All Continents') {
      // Debug the continent values we have in our data
      const uniqueContinents = Array.from(new Set(plates.map(p => p.continent)));
      console.log('Available continent values in data:', uniqueContinents);

      // Use case-insensitive matching to handle potential format differences
      result = result.filter(plate => {
        const matchesContinent = 
          plate.continent.toLowerCase() === selectedContinent.toLowerCase() ||
          // Handle common variations like "North America" vs "North_America"
          plate.continent.toLowerCase().replace(/[_\s-]/g, '') === selectedContinent.toLowerCase().replace(/[_\s-]/g, '');
        
        if (!matchesContinent && plate.continent !== 'Unknown') {
          console.log(`No match: Plate continent "${plate.continent}" doesn't match filter "${selectedContinent}"`);
        }
        
        return matchesContinent;
      });
      
      console.log(`After continent filter (${selectedContinent}):`, result.length);
      if (result.length === 0) {
        console.log('Continent filter returned no results. Available continents in data:',
          Array.from(new Set(plates.map(p => p.continent))).join(', '));
      }
    }

    // Apply search
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(plate => 
        plate.name.toLowerCase().includes(searchLower) || 
        plate.country.toLowerCase().includes(searchLower) ||
        plate.description.toLowerCase().includes(searchLower)
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

    setFilteredPlates(result);
  }, [plates, selectedCountry, selectedContinent, searchTerm, sortBy]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  // Add a debugging effect that runs whenever filtered data changes
  useEffect(() => {
    console.log('=== FILTER STATE ===');
    console.log('Selected country:', selectedCountry);
    console.log('Selected continent:', selectedContinent);
    console.log('Current filtered plates count:', filteredPlates.length);
    if (filteredPlates.length > 0) {
      console.log('First filtered plate:', filteredPlates[0]);
      console.log('Sample continents in filtered data:', filteredPlates.slice(0, 5).map(p => p.continent).join(', '));
    }
    console.log('=== END FILTER STATE ===');
  }, [filteredPlates, selectedCountry, selectedContinent]);

  // Add keyboard support for ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedPlate) {
        setSelectedPlate(null);
      }
    };

    // Add event listener when modal is open
    if (selectedPlate) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedPlate]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading plates...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">License Plates of the World</h1>
      
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
                Database connection unavailable. Showing sample license plate data for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      )}
      
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
              {availableContinents.map(continent => (
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
        <p>Showing {filteredPlates.length} of {plates.length} plates</p>
      </div>

      {/* No results message */}
      {filteredPlates.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No plates found</h3>
          <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
          <button
            onClick={resetFilters}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Plates Grid View */}
      {viewMode === 'grid' && filteredPlates.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlates.map(plate => (
            <div 
              key={plate.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              onClick={() => setSelectedPlate(plate)}
            >
              {plate.imageUrl && (
                <div className="h-48 bg-gray-100">
                  <img 
                    src={plate.imageUrl} 
                    alt={`${plate.name}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback for broken images
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/plate-placeholder.png';
                    }}
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{plate.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Country:</span> {plate.country}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <ContinentBadge continent={plate.continent} />
                  {plate.countryCode && (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium uppercase">
                      {plate.countryCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plates List View */}
      {viewMode === 'list' && filteredPlates.length > 0 && (
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlates.map(plate => (
                <tr 
                  key={plate.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedPlate(plate)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {plate.imageUrl ? (
                      <img 
                        src={plate.imageUrl} 
                        alt={plate.name}
                        className="h-16 w-16 object-cover rounded shadow-sm"
                        onError={(e) => {
                          // Fallback for broken images
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/images/plate-placeholder.png';
                        }}
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded"></div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{plate.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{plate.country}</div>
                    {plate.countryCode && (
                      <div className="text-xs text-gray-500 uppercase">{plate.countryCode}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ContinentBadge continent={plate.continent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">What are license plates?</h2>
        <p className="text-blue-700 mb-4">
          License plates are metal or plastic plates attached to vehicles for official identification purposes.
          They display registration numbers, country codes, and sometimes regional identifiers.
          The design, color, and format of license plates vary significantly across different countries and regions.
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

      {/* Add LicensePlateGallery Modal */}
      {selectedPlate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setSelectedPlate(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">License Plate Details</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedPlate(null)}
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <img 
                  src={selectedPlate.imageUrl} 
                  alt={`License plate in ${selectedPlate.country}`}
                  className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/images/plate-placeholder.png';
                  }}
                />
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedPlate.description}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Country</h4>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-50 p-2 rounded flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{selectedPlate.country}</span>
                  </span>
                  <ContinentBadge continent={selectedPlate.continent} />
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

export default PlatesPage; 