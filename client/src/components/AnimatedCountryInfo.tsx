import React, { useState, useEffect, useRef, useCallback } from 'react';
import CountryInfoCard from './CountryInfoCard';
import CountryMap from './CountryMap';
import { getImageUrl } from '../config/apiConfig';
import BollardGallery from './BollardGallery';
import RoadSignGallery from './RoadSignGallery';
import LicensePlateGallery from './LicensePlateGallery';
import LanguageGallery from './LanguageGallery';
import { 
  fetchRoadSignsByCountry, RoadSign, 
  fetchLanguagesByCountry, Language,
  fetchGoogleCarsByCountry, GoogleCar,
  fetchPolesByCountry, Pole
} from '../services/countryService';

// Define some custom styles for scrollbars
const scrollbarStyles = `
  /* For Webkit browsers like Chrome, Safari, Edge */
  ::-webkit-scrollbar {
    width: 6px;
    background: transparent;
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
  
  /* For Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
`;

interface AnimatedCountryInfoProps {
  country: any;
  isVisible: boolean;
  isCorrectAnswer: boolean;
  layout?: 'standard' | 'sides';
}

// Breakpoints for deciding whether to use side layout or bottom layout
const BREAKPOINT_WIDE = 1200; // Minimum width for side layout in pixels

const AnimatedCountryInfo: React.FC<AnimatedCountryInfoProps> = ({ 
  country, 
  isVisible, 
  isCorrectAnswer,
  layout = 'standard'
}) => {
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [animationStarted, setAnimationStarted] = useState<boolean>(false);
  const [useSideLayout, setUseSideLayout] = useState<boolean>(false);
  const [animationPhase, setAnimationPhase] = useState<number>(0);
  
  // State for gallery modals
  const [selectedBollard, setSelectedBollard] = useState<any>(null);
  const [selectedSign, setSelectedSign] = useState<any>(null);
  const [selectedPlate, setSelectedPlate] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<any>(null);
  const [selectedGoogleCar, setSelectedGoogleCar] = useState<any>(null);
  const [selectedPole, setSelectedPole] = useState<any>(null);
  
  // State for Road Signs data fetching
  const [signs, setSigns] = useState<RoadSign[]>([]);
  const [loadingSigns, setLoadingSigns] = useState<boolean>(false);
  const [signsError, setSignsError] = useState<string | null>(null);
  
  // State for Languages data fetching
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState<boolean>(false);
  const [languagesError, setLanguagesError] = useState<string | null>(null);
  
  // State for Google Cars data fetching
  const [googleCars, setGoogleCars] = useState<GoogleCar[]>([]);
  const [loadingGoogleCars, setLoadingGoogleCars] = useState<boolean>(false);
  const [googleCarsError, setGoogleCarsError] = useState<string | null>(null);
  
  // State for Poles data fetching
  const [poles, setPoles] = useState<Pole[]>([]);
  const [loadingPoles, setLoadingPoles] = useState<boolean>(false);
  const [polesError, setPolesError] = useState<string | null>(null);
  
  // Refs for tracking components
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Determine layout based on window width
  useEffect(() => {
    setUseSideLayout(windowWidth >= BREAKPOINT_WIDE);
  }, [windowWidth]);
  
  // Start animation sequence when component becomes visible
  useEffect(() => {
    if (isVisible && !animationStarted) {
      setAnimationStarted(true);
      setAnimationPhase(0);
      
      // Animation sequence timing
      const animationSequence = [300, 600, 900, 1200, 1500, 1800];
      
      // Start the animation sequence
      animationSequence.forEach((delay, index) => {
        setTimeout(() => {
          setAnimationPhase(index + 1);
        }, delay);
      });
    }
    
    // Reset animation when component is hidden
    if (!isVisible && animationStarted) {
      setAnimationStarted(false);
      setAnimationPhase(0);
    }
  }, [isVisible, animationStarted]);
  
  // Fetch road signs when component becomes visible
  useEffect(() => {
    if (isVisible && country?.id) {
      const fetchSigns = async () => {
        setLoadingSigns(true);
        setSignsError(null);
        try {
          const fetchedSigns = await fetchRoadSignsByCountry(country.id);
          setSigns(fetchedSigns);
          // If country.signs exists, we'll still use it in the UI,
          // but we'll override it with our fetched data when rendering
        } catch (error) {
          console.error('Error fetching road signs:', error);
          setSignsError('Failed to load road signs.');
        } finally {
          setLoadingSigns(false);
        }
      };
      fetchSigns();
    } else {
      setSigns([]);
      setLoadingSigns(false);
      setSignsError(null);
    }
  }, [country?.id, isVisible]);
  
  // Fetch languages when component becomes visible
  useEffect(() => {
    if (isVisible && country?.id) {
      const fetchLangs = async () => {
        setLoadingLanguages(true);
        setLanguagesError(null);
        try {
          const fetchedLanguages = await fetchLanguagesByCountry(country.id);
          setLanguages(fetchedLanguages);
        } catch (error) {
          console.error('Error fetching languages:', error);
          setLanguagesError('Failed to load languages.');
        } finally {
          setLoadingLanguages(false);
        }
      };
      fetchLangs();
    } else {
      setLanguages([]);
      setLoadingLanguages(false);
      setLanguagesError(null);
    }
  }, [country?.id, isVisible]);
  
  // Fetch Google Cars when component becomes visible
  useEffect(() => {
    if (isVisible && country?.id) {
      const fetchGoogleCars = async () => {
        setLoadingGoogleCars(true);
        setGoogleCarsError(null);
        try {
          const fetchedGoogleCars = await fetchGoogleCarsByCountry(country.id);
          setGoogleCars(fetchedGoogleCars);
        } catch (error) {
          console.error('Error fetching Google cars:', error);
          setGoogleCarsError('Failed to load Google cars.');
        } finally {
          setLoadingGoogleCars(false);
        }
      };
      fetchGoogleCars();
    } else {
      setGoogleCars([]);
      setLoadingGoogleCars(false);
      setGoogleCarsError(null);
    }
  }, [country?.id, isVisible]);
  
  // Fetch Poles when component becomes visible
  useEffect(() => {
    if (isVisible && country?.id) {
      const fetchPoles = async () => {
        setLoadingPoles(true);
        setPolesError(null);
        try {
          const fetchedPoles = await fetchPolesByCountry(country.id);
          setPoles(fetchedPoles);
        } catch (error) {
          console.error('Error fetching poles:', error);
          setPolesError('Failed to load poles.');
        } finally {
          setLoadingPoles(false);
        }
      };
      fetchPoles();
    } else {
      setPoles([]);
      setLoadingPoles(false);
      setPolesError(null);
    }
  }, [country?.id, isVisible]);
  
  // Memoize the closeAllModals function to use in the effect dependency array
  const closeAllModalsCallback = useCallback(() => {
    setSelectedBollard(null);
    setSelectedSign(null);
    setSelectedPlate(null);
    setSelectedLanguage(null);
    setSelectedGoogleCar(null);
    setSelectedPole(null);
  }, []);
  
  // Add event listener for Escape key to close modals
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (selectedBollard || selectedSign || selectedPlate || selectedLanguage || selectedGoogleCar || selectedPole)) {
        closeAllModalsCallback();
      }
    };
    
    // Only add the event listener when a modal is open
    if (selectedBollard || selectedSign || selectedPlate || selectedLanguage || selectedGoogleCar || selectedPole) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedBollard, selectedSign, selectedPlate, selectedLanguage, selectedGoogleCar, selectedPole, closeAllModalsCallback]);
  
  // If not visible or no country data, don't render
  if (!isVisible || !country) return null;
  
  // Use standard layout if screen is too narrow or layout is standard
  if (!useSideLayout || layout === 'standard') {
    return (
      <div id="countryInfo" className="mt-6 animate-fadeIn">
        <CountryInfoCard country={country} isVisible={true} />
      </div>
    );
  }
  
  // For the special "sides" layout mode, we'll render only the left or right column content
  // The parent component will handle the actual grid layout
  if (layout === 'sides') {
    return (
      <>
        {/* Add the scrollbar styles */}
        <style>{scrollbarStyles}</style>
        
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 5 }}>
          <div className="h-full w-full flex justify-between items-start">
            {/* Left column - positioned at left edge */}
            <div className="w-1/4 pt-16 pl-6 pointer-events-auto space-y-4 overflow-auto max-h-screen pb-20" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent' }}>
              {/* Country header */}
              <div 
                className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${
                  animationPhase >= 1 ? 'transform translate-x-0' : 'transform -translate-x-full opacity-0'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {country.flagUrl && (
                    <img 
                      src={country.flagUrl} 
                      alt={`Flag of ${country.name}`} 
                      className="h-10 w-16 object-cover rounded shadow"
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-blue-700">{country.name}</h2>
                    {country.code && (
                      <div className="text-sm text-gray-500">
                        Code: {country.code.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                {country.id && (
                  <div className="mt-3 text-center">
                    <a 
                      href={`/countries/${country.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      <span className="mr-1">View Country Page</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
              
              {/* General Information */}
              <div 
                className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${
                  animationPhase >= 2 ? 'transform translate-x-0' : 'transform -translate-x-full opacity-0'
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">General Information</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-gray-500">Capital</div>
                    <div className="font-medium text-gray-800">{country.capital || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Continent</div>
                    <div className="font-medium text-gray-800">{country.continent || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Population</div>
                    <div className="font-medium text-gray-800">{country.population?.toLocaleString() || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Area</div>
                    <div className="font-medium text-gray-800">{country.area ? `${country.area.toLocaleString()} km²` : 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              {/* Location */}
              <div 
                className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${
                  animationPhase >= 3 ? 'transform translate-x-0' : 'transform -translate-x-full opacity-0'
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Location</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-gray-500">Driving Side</div>
                    <div className="font-medium text-gray-800">{
                      country.driving_side 
                        ? country.driving_side.charAt(0).toUpperCase() + country.driving_side.slice(1) 
                        : 'N/A'
                    }</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone Code</div>
                    <div className="font-medium text-gray-800">{country.phone_prefix || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Internet Domains</div>
                    <div className="font-medium text-gray-800">
                      {country.domain && country.domain.length > 0 
                        ? country.domain.map((d: string) => `${d}`).join(', ') 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Currency Information - New section */}
              {country.currency && country.currency.length > 0 && (
                <div 
                  className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${
                    animationPhase >= 3 ? 'transform translate-x-0 delay-200' : 'transform -translate-x-full opacity-0'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Currency</h3>
                  <div className="space-y-3">
                    {country.currency.map((curr: { name: string; symbol: string; code: string }, idx: number) => (
                      <div key={idx} className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                          <div className="text-sm font-bold">{curr.symbol}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{curr.name}</div>
                          <div className="text-xs text-gray-500">{curr.code}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Middle area - empty space for the quiz content */}
            <div className="flex-grow"></div>
            
            {/* Right column - positioned at right edge */}
            <div className="w-1/4 pt-16 pr-6 pointer-events-auto space-y-4 overflow-auto max-h-screen pb-20" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent' }}>
              {/* Map */}
              <div 
                className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${ 
                  animationPhase >= 4 ? 'transform translate-x-0' : 'transform translate-x-full opacity-0' 
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Map</h3>
                <div className="h-40 overflow-hidden rounded-md">
                  <CountryMap countryName={country.name} countryCode={country.code} />
                </div>
              </div>
              
              {/* Camera Generation */}
              {country.camera_generation && Object.keys(country.camera_generation).length > 0 && (
                <div 
                  className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${ 
                    animationPhase >= 4 ? 'transform translate-x-0 delay-200' : 'transform translate-x-full opacity-0' 
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Street View Coverage</h3>
                  <div className="space-y-2">
                    {Object.entries(country.camera_generation || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {key.toLowerCase().startsWith('gen') 
                            ? `Generation ${key.replace(/^gen/i, '')}`
                            : key}
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Bollards - Conditionally render */}
              {country.bollards && country.bollards.length > 0 && (
                <div 
                  className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${ 
                    animationPhase >= 5 ? 'transform translate-x-0' : 'transform translate-x-full opacity-0' 
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Bollards</h3>
                  <div className="flex flex-col">
                    <div className="w-full">
                      <div 
                        className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mb-2 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedBollard(country.bollards[0])}
                      >
                        {country.bollards[0]?.imageUrl ? (
                          <img 
                            src={getImageUrl(country.bollards[0].imageUrl)} 
                            alt={`Bollard in ${country.name}`} 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">Image not available</div>
                        )}
                      </div>
                      {country.bollards[0]?.description && (
                        <div className="text-sm text-gray-700 mt-2 mb-1">
                          {country.bollards[0].description.length > 100 
                            ? country.bollards[0].description.substring(0, 100) + '...'
                            : country.bollards[0].description
                          }
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-gray-500">
                          {country.bollards.length} bollard{country.bollards.length !== 1 ? 's' : ''} found
                        </div>
                        <button 
                          onClick={() => setSelectedBollard(country.bollards)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <span>View All</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Signs - Conditionally render */}
              {((signs && signs.length > 0) || (country.signs && country.signs.length > 0)) && !loadingSigns && (
                <div 
                  className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${ 
                    animationPhase >= 6 ? 'transform translate-x-0' : 'transform translate-x-full opacity-0' 
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Signs</h3>
                  <div className="flex flex-col">
                     <div className="w-full">
                      <div 
                        className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mb-2 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedSign(signs.length > 0 ? signs[0] : country.signs[0])} 
                      >
                        {(signs[0] || country.signs[0])?.imageUrl ? (
                          <img 
                            src={getImageUrl((signs[0] || country.signs[0]).imageUrl)} 
                            alt={`Road sign in ${country.name}`} 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">Image not available</div>
                        )}
                      </div>
                      {(signs[0] || country.signs[0])?.description && (
                        <div className="text-sm text-gray-700 mt-2 mb-1">
                          {(signs[0] || country.signs[0]).description.length > 100
                            ? (signs[0] || country.signs[0]).description.substring(0, 100) + '...'
                            : (signs[0] || country.signs[0]).description
                          }
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-gray-500">
                          {(signs.length || country.signs.length)} road sign{(signs.length || country.signs.length) !== 1 ? 's' : ''} found
                        </div>
                        <button 
                          onClick={() => setSelectedSign(signs.length > 0 ? signs : country.signs)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <span>View All</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* License Plates - Conditionally render */}
              {country.plates && country.plates.length > 0 && (
                <div 
                  className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${ 
                    animationPhase >= 6 ? 'transform translate-x-0 delay-200' : 'transform translate-x-full opacity-0' 
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">License Plates</h3>
                  <div className="flex flex-col">
                    <div className="w-full">
                      <div 
                        className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mb-2 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedPlate(country.plates[0])}
                      >
                        {country.plates[0]?.imageUrl ? (
                          <img 
                            src={getImageUrl(country.plates[0].imageUrl)} 
                            alt={`License plate from ${country.name}`} 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">Image not available</div>
                        )}
                      </div>
                      {country.plates[0]?.description && (
                        <div className="text-sm text-gray-700 mt-2 mb-1">
                          {country.plates[0].description.length > 100
                            ? country.plates[0].description.substring(0, 100) + '...'
                            : country.plates[0].description
                          }
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-gray-500">
                          {country.plates.length} license plate{country.plates.length !== 1 ? 's' : ''} found
                        </div>
                        <button 
                          onClick={() => setSelectedPlate(country.plates)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <span>View All</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Languages Card - Conditionally render */}
              {languages && languages.length > 0 && !loadingLanguages && (
                <div 
                  className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${ 
                    animationPhase >= 6 ? 'transform translate-x-0 delay-400' : 'transform translate-x-full opacity-0'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Languages / Scripts</h3>
                  <div className="flex flex-col">
                    <div className="w-full">
                      <div 
                        className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mb-2 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedLanguage(languages[0])}
                      >
                        {languages[0]?.imageUrl ? (
                          <img 
                            src={getImageUrl(languages[0].imageUrl)} 
                            alt={`Language/script in ${country.name}`} 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">Image not available</div>
                        )}
                      </div>
                      {languages[0]?.description && (
                        <div className="text-sm text-gray-700 mt-2 mb-1">
                          {languages[0].description.length > 100
                            ? languages[0].description.substring(0, 100) + '...'
                            : languages[0].description
                          }
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-gray-500">
                          {languages.length} language{languages.length !== 1 ? 's' : ''} found
                        </div>
                        <button 
                          onClick={() => setSelectedLanguage(languages)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <span>View All</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Cars - Conditionally render */}
              {googleCars && googleCars.length > 0 && !loadingGoogleCars && (
                <div 
                  className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${ 
                    animationPhase >= 6 ? 'transform translate-x-0 delay-600' : 'transform translate-x-full opacity-0' 
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Google Cars</h3>
                  <div className="flex flex-col">
                    <div className="w-full">
                      <div 
                        className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mb-2 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedGoogleCar(googleCars[0])}
                      >
                        {googleCars[0]?.imageUrl ? (
                          <img 
                            src={getImageUrl(googleCars[0].imageUrl)} 
                            alt={`Google Car in ${country.name}`} 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">Image not available</div>
                        )}
                      </div>
                      {googleCars[0]?.description && (
                        <div className="text-sm text-gray-700 mt-2 mb-1">
                          {googleCars[0].description.length > 100
                            ? googleCars[0].description.substring(0, 100) + '...'
                            : googleCars[0].description
                          }
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-gray-500">
                          {googleCars.length} Google car{googleCars.length !== 1 ? 's' : ''} found
                        </div>
                        <button 
                          onClick={() => setSelectedGoogleCar(googleCars)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <span>View All</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Poles - Conditionally render */}
              {poles && poles.length > 0 && !loadingPoles && (
                <div 
                  className={`bg-white rounded-lg shadow-md p-4 transition-all duration-500 ease-out ${ 
                    animationPhase >= 6 ? 'transform translate-x-0 delay-800' : 'transform translate-x-full opacity-0' 
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Utility Poles</h3>
                  <div className="flex flex-col">
                    <div className="w-full">
                      <div 
                        className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mb-2 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedPole(poles[0])}
                      >
                        {poles[0]?.imageUrl ? (
                          <img 
                            src={getImageUrl(poles[0].imageUrl)} 
                            alt={`Utility pole in ${country.name}`} 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">Image not available</div>
                        )}
                      </div>
                      {poles[0]?.description && (
                        <div className="text-sm text-gray-700 mt-2 mb-1">
                          {poles[0].description.length > 100
                            ? poles[0].description.substring(0, 100) + '...'
                            : poles[0].description
                          }
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-gray-500">
                          {poles.length} utility pole{poles.length !== 1 ? 's' : ''} found
                        </div>
                        <button 
                          onClick={() => setSelectedPole(poles)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <span>View All</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
        
        {/* Modals for galleries */}
        {selectedBollard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={closeAllModalsCallback}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Bollards in {country.name}</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={closeAllModalsCallback}
                    aria-label="Close modal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="overflow-auto">
                  {Array.isArray(selectedBollard) ? (
                    <BollardGallery bollards={selectedBollard} isLoading={false} />
                  ) : (
                    <div className="max-w-2xl mx-auto">
                      <div className="mb-4">
                        <img 
                          src={getImageUrl(selectedBollard.imageUrl)} 
                          alt={`Bollard in ${country.name}`}
                          className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600">{selectedBollard.description || 'No description available'}</p>
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedSign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={closeAllModalsCallback}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Road Signs in {country.name}</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={closeAllModalsCallback}
                    aria-label="Close modal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="overflow-auto">
                  {Array.isArray(selectedSign) ? (
                    <RoadSignGallery roadSigns={selectedSign} isLoading={false} />
                  ) : (
                    <div className="max-w-2xl mx-auto">
                      <div className="mb-4">
                        <img 
                          src={getImageUrl(selectedSign.imageUrl)} 
                          alt={`Road sign in ${country.name}`}
                          className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600">{selectedSign.description || 'No description available'}</p>
                      </div>
                      
                      {selectedSign.types && selectedSign.types.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Types</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedSign.types.map((type: string) => (
                              <span 
                                key={type} 
                                className="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full font-medium capitalize"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedSign.googleMapsUrl && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Location</h4>
                          <a 
                            href={selectedSign.googleMapsUrl} 
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedPlate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={closeAllModalsCallback}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">License Plates in {country.name}</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={closeAllModalsCallback}
                    aria-label="Close modal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="overflow-auto">
                  {Array.isArray(selectedPlate) ? (
                    <LicensePlateGallery licensePlates={selectedPlate} isLoading={false} />
                  ) : (
                    <div className="max-w-2xl mx-auto">
                      <div className="mb-4">
                        <img 
                          src={getImageUrl(selectedPlate.imageUrl)} 
                          alt={`License plate from ${country.name}`}
                          className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600">{selectedPlate.description || 'No description available'}</p>
                      </div>
                      
                      {selectedPlate.format && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Format</h4>
                          <p className="text-gray-600">{selectedPlate.format}</p>
                        </div>
                      )}
                      
                      {selectedPlate.years && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Years</h4>
                          <p className="text-gray-600">{selectedPlate.years}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Language Gallery Modal - New */} 
        {selectedLanguage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={closeAllModalsCallback}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Languages/Scripts in {country.name}</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={closeAllModalsCallback}
                    aria-label="Close modal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="overflow-auto">
                  {Array.isArray(selectedLanguage) ? (
                    <LanguageGallery languages={selectedLanguage} isLoading={false} />
                  ) : (
                    <div className="max-w-2xl mx-auto">
                      <div className="mb-4">
                        <img 
                          src={getImageUrl(selectedLanguage.imageUrl)} 
                          alt={`Language/script in ${country.name}`}
                          className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600">{selectedLanguage.description || 'No description available'}</p>
                      </div>
                      
                      {/* Note: We might need to fetch country details here if not already loaded */} 
                      {/* Placeholder for country list if needed for single view */}
                      {/* <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Countries</h4>
                        <p className="text-gray-500"> Country details here... </p>
                      </div> */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Google Car Gallery Modal */}
        {selectedGoogleCar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={closeAllModalsCallback}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Google Cars in {country.name}</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={closeAllModalsCallback}
                    aria-label="Close modal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="overflow-auto">
                  {Array.isArray(selectedGoogleCar) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedGoogleCar.map((car) => (
                        <div 
                          key={car._id} 
                          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                            <img 
                              src={getImageUrl(car.imageUrl)} 
                              alt={car.description || `Google Car in ${country.name}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '/images/placeholder.png';
                              }}
                            />
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-gray-800 mb-1 truncate" title={car.description}>
                              {car.description || 'Google Car'}
                            </h4>
                            {car.generation && (
                              <p className="text-xs text-gray-500 mb-1">
                                Generation: {car.generation}
                              </p>
                            )}
                            {car.googleMapsUrl && (
                              <a 
                                href={car.googleMapsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-2"
                              >
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View on Google Maps
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto">
                      <div className="mb-4">
                        <img 
                          src={getImageUrl(selectedGoogleCar.imageUrl)} 
                          alt={`Google Car in ${country.name}`}
                          className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600">{selectedGoogleCar.description || 'No description available'}</p>
                      </div>
                      
                      {selectedGoogleCar.generation && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Generation</h4>
                          <p className="text-gray-600">{selectedGoogleCar.generation}</p>
                        </div>
                      )}
                      
                      {selectedGoogleCar.year && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Year</h4>
                          <p className="text-gray-600">{selectedGoogleCar.year}</p>
                        </div>
                      )}
                      
                      {selectedGoogleCar.googleMapsUrl && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Location</h4>
                          <a 
                            href={selectedGoogleCar.googleMapsUrl} 
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pole Gallery Modal - update this part with the clickable cards */}
        {selectedPole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={closeAllModalsCallback}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Utility Poles in {country.name}</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={closeAllModalsCallback}
                    aria-label="Close modal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="overflow-auto">
                  {Array.isArray(selectedPole) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedPole.map((pole) => (
                        <div 
                          key={pole._id} 
                          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedPole(pole)}
                        >
                          <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                            <img 
                              src={getImageUrl(pole.imageUrl)} 
                              alt={pole.description || `Utility pole in ${country.name}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '/images/placeholder.png';
                              }}
                            />
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-gray-800 mb-1 truncate" title={pole.description}>
                              {pole.description || 'Utility Pole'}
                            </h4>
                            {pole.googleMapsUrl && (
                              <a 
                                href={pole.googleMapsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-2"
                                onClick={(e) => e.stopPropagation()} // Prevent the parent onClick from firing
                              >
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View on Google Maps
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto">
                      <div className="mb-4">
                        <img 
                          src={getImageUrl(selectedPole.imageUrl)} 
                          alt={`Utility pole in ${country.name}`}
                          className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600">{selectedPole.description || 'No description available'}</p>
                      </div>
                      
                      {selectedPole.googleMapsUrl && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Location</h4>
                          <a 
                            href={selectedPole.googleMapsUrl} 
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  
  // Standard side-by-side layout (legacy)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 mt-6" id="countryInfo">
      {/* Left column */}
      <div className="space-y-4">
        {/* Country header */}
        <div 
          className={`bg-white rounded-lg shadow-md p-4 ${
            animationPhase >= 1 ? 'animate-slideInLeft' : 'transform -translate-x-full'
          }`}
        >
          <div className="flex items-center space-x-3">
            {country.flagUrl && (
              <img 
                src={country.flagUrl} 
                alt={`Flag of ${country.name}`} 
                className="h-10 w-16 object-cover rounded shadow"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-blue-700">{country.name}</h2>
              {country.code && (
                <div className="text-sm text-gray-500">
                  Code: {country.code.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* General Information */}
        <div 
          className={`bg-white rounded-lg shadow-md p-4 ${
            animationPhase >= 2 ? 'animate-slideInLeft' : 'transform -translate-x-full'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">General Information</h3>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-500">Capital</div>
              <div className="font-medium text-gray-800">{country.capital || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Continent</div>
              <div className="font-medium text-gray-800">{country.continent || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Population</div>
              <div className="font-medium text-gray-800">{country.population?.toLocaleString() || 'N/A'}</div>
            </div>
          </div>
        </div>
        
        {/* Location */}
        <div 
          className={`bg-white rounded-lg shadow-md p-4 ${
            animationPhase >= 3 ? 'animate-slideInLeft' : 'transform -translate-x-full'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Location</h3>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-500">Driving Side</div>
              <div className="font-medium text-gray-800">{
                country.driving_side 
                  ? country.driving_side.charAt(0).toUpperCase() + country.driving_side.slice(1) 
                  : 'N/A'
              }</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone Code</div>
              <div className="font-medium text-gray-800">{country.phone_prefix || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Internet Domains</div>
              <div className="font-medium text-gray-800">
                {country.domain && country.domain.length > 0 
                  ? country.domain.map((d: string) => `.${d}`).join(', ') 
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right column */}
      <div className="space-y-4">
        {/* Map */}
        <div 
          className={`bg-white rounded-lg shadow-md p-4 ${
            animationPhase >= 4 ? 'animate-slideInRight' : 'transform translate-x-full'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Map</h3>
          <div className="h-40 overflow-hidden rounded">
            <CountryMap countryName={country.name} countryCode={country.code} />
          </div>
        </div>
        
        {/* Bollards */}
        <div 
          className={`bg-white rounded-lg shadow-md p-4 ${
            animationPhase >= 5 ? 'animate-slideInRight' : 'transform translate-x-full'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Bollards</h3>
          <div className="text-center text-gray-500">
            {isCorrectAnswer 
              ? 'Click View Full Details below to see more information about bollards in this country.' 
              : 'Answer correctly to see more information!'}
          </div>
        </div>
        
        {/* Signs */}
        <div 
          className={`bg-white rounded-lg shadow-md p-4 ${
            animationPhase >= 6 ? 'animate-slideInRight' : 'transform translate-x-full'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Signs</h3>
          <div className="text-center text-gray-500">
            {isCorrectAnswer 
              ? 'Click View Full Details below to see more information about road signs in this country.' 
              : 'Answer correctly to see more information!'}
          </div>
        </div>
        
        {/* Google Cars */}
        <div 
          className={`bg-white rounded-lg shadow-md p-4 ${
            animationPhase >= 6 ? 'animate-slideInRight' : 'transform translate-x-full'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Google Cars</h3>
          <div className="text-center text-gray-500">
            {isCorrectAnswer 
              ? 'Click View Full Details below to see more information about Google cars in this country.' 
              : 'Answer correctly to see more information!'}
          </div>
        </div>
        
        {/* Utility Poles */}
        <div 
          className={`bg-white rounded-lg shadow-md p-4 ${
            animationPhase >= 6 ? 'animate-slideInRight delay-300' : 'transform translate-x-full'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Utility Poles</h3>
          <div className="text-center text-gray-500">
            {isCorrectAnswer 
              ? 'Click View Full Details below to see more information about utility poles in this country.' 
              : 'Answer correctly to see more information!'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedCountryInfo; 