import React, { useState, useEffect } from 'react';
import CountryMap from './CountryMap';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {
  fetchBollardsByCountry, Bollard as BaseBollard,
  fetchLicensePlatesByCountry, LicensePlate as BaseLicensePlate,
  fetchRoadSignsByCountry, RoadSign as BaseRoadSign,
  fetchLanguagesByCountry, Language as BaseLanguage
} from '../services/countryService';
import { getImageUrl } from '../config/apiConfig';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Extended interfaces with optional properties that might be used in the UI
interface Bollard extends BaseBollard {
  location?: string;
  notes?: string;
}

interface LicensePlate extends BaseLicensePlate {
  format?: string;
  years?: string;
  notes?: string;
}

interface RoadSign extends BaseRoadSign {
  meaning?: string;
  notes?: string;
}

interface Language extends BaseLanguage {
  notes?: string;
}

interface CountryDetails {
  _id: string;
  name: string;
}

interface CountryInfoCardProps {
  country: {
    id?: string;
    name: string;
    capital?: string;
    continent?: string;
    code?: string;
    flagUrl?: string;
    in_geoguessr?: boolean;
    population?: number;
    area?: number;
    phone_prefix?: string;
    driving_side?: 'left' | 'right';
    domain?: string[];
    currency?: { name: string; symbol: string; code: string }[];
    camera_generation?: Record<string, string>;
  };
  isVisible: boolean;
  isFullPage?: boolean; // Optional prop to control size and styling
}

const CountryInfoCard: React.FC<CountryInfoCardProps> = ({ country, isVisible, isFullPage = false }) => {
  // Bollards State
  const [bollards, setBollards] = useState<Bollard[]>([]);
  const [loadingBollards, setLoadingBollards] = useState<boolean>(false);
  const [bollardsError, setBollardsError] = useState<string | null>(null);
  const [isBollardsExpanded, setIsBollardsExpanded] = useState<boolean>(true);
  
  // License Plates State
  const [plates, setPlates] = useState<LicensePlate[]>([]);
  const [loadingPlates, setLoadingPlates] = useState<boolean>(false);
  const [platesError, setPlatesError] = useState<string | null>(null);
  const [isPlatesExpanded, setIsPlatesExpanded] = useState<boolean>(true);
  
  // Road Signs State
  const [signs, setSigns] = useState<RoadSign[]>([]);
  const [loadingSigns, setLoadingSigns] = useState<boolean>(false);
  const [signsError, setSignsError] = useState<string | null>(null);
  const [isSignsExpanded, setIsSignsExpanded] = useState<boolean>(true);
  
  // Language State
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState<boolean>(false);
  const [languagesError, setLanguagesError] = useState<string | null>(null);
  const [isLanguagesExpanded, setIsLanguagesExpanded] = useState<boolean>(true);
  
  // State for selected items for modals
  const [selectedBollard, setSelectedBollard] = useState<Bollard | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<LicensePlate | null>(null);
  const [selectedSign, setSelectedSign] = useState<RoadSign | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [languageCountries, setLanguageCountries] = useState<CountryDetails[]>([]);
  const [loadingLanguageCountries, setLoadingLanguageCountries] = useState<boolean>(false);
  
  // Effect to fetch Bollards
  useEffect(() => {
    if (isVisible && country.id) {
      const fetchBollards = async () => {
        setLoadingBollards(true);
        setBollardsError(null);
        try {
          const fetchedBollards = await fetchBollardsByCountry(country.id!);
          setBollards(fetchedBollards);
          setIsBollardsExpanded(fetchedBollards.length > 0);
        } catch (error) {
          console.error('Error fetching bollards:', error);
          setBollardsError('Failed to load bollards.');
          setIsBollardsExpanded(false);
        } finally {
          setLoadingBollards(false);
        }
      };
      fetchBollards();
    } else {
      setBollards([]); setLoadingBollards(false); setBollardsError(null); setIsBollardsExpanded(false);
    }
  }, [country.id, isVisible]);

  // Effect to fetch License Plates
  useEffect(() => {
    if (isVisible && country.id) {
      const fetchPlates = async () => {
        setLoadingPlates(true);
        setPlatesError(null);
        try {
          const fetchedPlates = await fetchLicensePlatesByCountry(country.id!);
          setPlates(fetchedPlates);
          setIsPlatesExpanded(fetchedPlates.length > 0);
        } catch (error) {
          console.error('Error fetching license plates:', error);
          setPlatesError('Failed to load license plates.');
          setIsPlatesExpanded(false);
        } finally {
          setLoadingPlates(false);
        }
      };
      fetchPlates();
    } else {
      setPlates([]); setLoadingPlates(false); setPlatesError(null); setIsPlatesExpanded(false);
    }
  }, [country.id, isVisible]);

  // Effect to fetch Road Signs
  useEffect(() => {
    if (isVisible && country.id) {
      const fetchSigns = async () => {
        setLoadingSigns(true);
        setSignsError(null);
        try {
          const fetchedSigns = await fetchRoadSignsByCountry(country.id!);
          setSigns(fetchedSigns);
          setIsSignsExpanded(fetchedSigns.length > 0);
        } catch (error) {
          console.error('Error fetching road signs:', error);
          setSignsError('Failed to load road signs.');
          setIsSignsExpanded(false);
        } finally {
          setLoadingSigns(false);
        }
      };
      fetchSigns();
    } else {
      setSigns([]); setLoadingSigns(false); setSignsError(null); setIsSignsExpanded(false);
    }
  }, [country.id, isVisible]);

  // Effect to fetch Languages
  useEffect(() => {
    if (isVisible && country.id) {
      const fetchLanguages = async () => {
        setLoadingLanguages(true);
        setLanguagesError(null);
        try {
          const fetchedLanguages = await fetchLanguagesByCountry(country.id!);
          setLanguages(fetchedLanguages);
          setIsLanguagesExpanded(fetchedLanguages.length > 0);
        } catch (error) {
          console.error('Error fetching languages:', error);
          setLanguagesError('Failed to load languages.');
          setIsLanguagesExpanded(false);
        } finally {
          setLoadingLanguages(false);
        }
      };
      fetchLanguages();
    } else {
      setLanguages([]); setLoadingLanguages(false); setLanguagesError(null); setIsLanguagesExpanded(false);
    }
  }, [country.id, isVisible]);

  // Handlers to open modals
  const handleBollardClick = (bollard: Bollard) => setSelectedBollard(bollard);
  const handlePlateClick = (plate: LicensePlate) => setSelectedPlate(plate);
  const handleSignClick = (sign: RoadSign) => setSelectedSign(sign);
  const handleLanguageClick = (language: Language) => {
    setSelectedLanguage(language);
    setLanguageCountries([]);
  };

  // Handlers to close modals
  const closeModal = () => {
    setSelectedBollard(null);
    setSelectedPlate(null);
    setSelectedSign(null);
    setSelectedLanguage(null);
  };

  // Effect to handle Escape key closing modals
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
       if (event.key === 'Escape') {
         closeModal();
       }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Effect to fetch countries for selected language
  useEffect(() => {
    const fetchLanguageCountries = async () => {
      if (selectedLanguage && selectedLanguage.countries.length > 0) {
        setLoadingLanguageCountries(true);
        try {
          const countryPromises = selectedLanguage.countries.map(countryId => 
            axios.get(`/api/countries/${countryId}`)
          );
          const responses = await Promise.all(countryPromises);
          const countries = responses
            .filter(response => response.data && response.data.success)
            .map(response => response.data.country as CountryDetails);
          setLanguageCountries(countries);
        } catch (error) {
          console.error('Error fetching language countries:', error);
        } finally {
          setLoadingLanguageCountries(false);
        }
      }
    };

    fetchLanguageCountries();
  }, [selectedLanguage]);

  // Early return if not visible
  if (!isVisible) return null;
  
  // Get continent color
  const getContinentColor = (continent?: string) => {
    switch (continent) {
      case 'Africa': return { bg: 'bg-yellow-100', text: 'text-yellow-800', accent: 'bg-yellow-500' };
      case 'Asia': return { bg: 'bg-red-100', text: 'text-red-800', accent: 'bg-red-500' };
      case 'Europe': return { bg: 'bg-blue-100', text: 'text-blue-800', accent: 'bg-blue-500' };
      case 'North America': return { bg: 'bg-green-100', text: 'text-green-800', accent: 'bg-green-500' };
      case 'South America': return { bg: 'bg-purple-100', text: 'text-purple-800', accent: 'bg-purple-500' };
      case 'Oceania': return { bg: 'bg-indigo-100', text: 'text-indigo-800', accent: 'bg-indigo-500' };
      case 'Antarctica': return { bg: 'bg-gray-100', text: 'text-gray-800', accent: 'bg-gray-500' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', accent: 'bg-gray-500' };
    }
  };

  // Format country code for display
  const formatCountryCode = (code?: string) => {
    return code ? code.toUpperCase() : 'N/A';
  };
  
  // Determine card size classes based on isFullPage prop
  const cardSizeClasses = isFullPage
    ? "w-full" // Full width when on dedicated page
    : "mt-6"; // Standard size for quiz/game context
  
  // Get continent colors
  const continentColors = country.continent ? getContinentColor(country.continent) : getContinentColor();

  // Format population with commas
  const formatNumber = (num?: number) => {
    return num?.toLocaleString() || 'N/A';
  };

  // Format area with commas and km²
  const formatArea = (area?: number) => {
    return area ? `${area.toLocaleString()} km²` : 'N/A';
  };

  // Parse camera generation data into chart format
  const parseCameraData = (data?: Record<string, string>) => {
    if (!data || Object.keys(data).length === 0) return null;
    
    const chartData = {
      labels: [] as string[],
      values: [] as number[],
      colors: [] as string[],
    };
    
    // Color palette for different generations
    const colorPalette = [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
    ];
    
    // Process data differently based on format
    Object.entries(data).forEach(([key, value], index) => {
      // Check if the value is in format "(gen3:15%, gen4:85%)"
      if (value.includes(':') && (value.startsWith('(') || !key.toLowerCase().includes('gen'))) {
        // Parse multiple generations from a single string
        const cleanValue = value.replace(/[()]/g, '').trim();
        const pairs = cleanValue.split(',').map(pair => pair.trim());
        
        pairs.forEach((pair, pairIndex) => {
          const [genLabel, percentage] = pair.split(':').map(part => part.trim());
          const numericValue = parseFloat(percentage.replace('%', ''));
          
          chartData.labels.push(genLabel);
          chartData.values.push(numericValue);
          chartData.colors.push(colorPalette[(index + pairIndex) % colorPalette.length]);
        });
      } else {
        // Standard format: each key is a generation and value is the percentage
        const numericValue = parseFloat(value.replace('%', ''));
        chartData.labels.push(key);
        chartData.values.push(numericValue);
        chartData.colors.push(colorPalette[index % colorPalette.length]);
      }
    });
    
    return chartData;
  };

  return (
    <div className={`${cardSizeClasses} animate-fadeIn`}>
      {/* Simple header with country name and flag */}
      <div className={`relative overflow-hidden rounded-t-lg ${isFullPage ? 'h-32' : 'h-24'}`}>
        {/* Background gradient with continent color */}
        <div className={`absolute inset-0 ${continentColors.accent} opacity-10`}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-800 opacity-80"></div>
        
        <div className="relative z-10 h-full flex items-center px-6 py-4">
          <div className="flex items-center justify-between w-full">
            {/* Country name and code */}
            <div>
              <h1 className={`text-white font-bold ${isFullPage ? 'text-4xl' : 'text-2xl'}`}>
                {country.name}
              </h1>
              {country.code && (
                <div className="text-blue-100 mt-1 flex items-center">
                  <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm mr-2">
                    {formatCountryCode(country.code)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Flag image */}
            {country.flagUrl && (
              <div>
                <img 
                  src={country.flagUrl} 
                  alt={`Flag of ${country.name}`} 
                  className="h-20 shadow-lg rounded-md border-2 border-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-b-lg shadow-lg border border-gray-200 border-t-0">
        <div className="p-6">
          {/* Main Grid: Info Cards (+ Map in Full Page mode) */}
          <div className={`grid grid-cols-1 ${isFullPage ? 'md:grid-cols-3 gap-6' : 'gap-4'}`}>
            {/* Map Column (Full Page Only) */}
            {isFullPage && (
              <div className="md:col-span-1 order-2 md:order-1 h-[300px] md:h-full bg-gray-50 rounded-lg shadow-sm border border-gray-100">
                <CountryMap countryName={country.name} countryCode={country.code} />
              </div>
            )}
            {/* Info Cards Column (Always renders) */}
            <div className={`space-y-4 ${isFullPage ? 'md:col-span-2 order-1 md:order-2' : 'w-full col-span-1'}`}>
              {/* General Info Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">General Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Capital */}
                  <div>
                    <div className="text-sm text-gray-500">Capital</div>
                    <div className="font-medium text-gray-800 flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {country.capital || 'N/A'}
                    </div>
                  </div>
                  
                  {/* Continent */}
                  <div>
                    <div className="text-sm text-gray-500">Continent</div>
                    <div className="font-medium flex items-center mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-sm ${continentColors.bg} ${continentColors.text}`}>
                        {country.continent}
                      </span>
                    </div>
                  </div>
                  
                  {/* Population */}
                  <div>
                    <div className="text-sm text-gray-500">Population</div>
                    <div className="font-medium text-gray-800 flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {formatNumber(country.population)}
                    </div>
                  </div>
                  
                  {/* Area */}
                  <div>
                    <div className="text-sm text-gray-500">Area</div>
                    <div className="font-medium text-gray-800 flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                      {formatArea(country.area)}
                    </div>
                  </div>

                  {/* GeoGuessr Status */}
                  <div>
                    <div className="text-sm text-gray-500">GeoGuessr Status</div>
                    <div className="font-medium text-gray-800 flex items-center mt-1">
                      {country.in_geoguessr ? (
                        <span className="text-green-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Available
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Not Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Location Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Location & Travel</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Driving Side */}
                  <div>
                    <div className="text-sm text-gray-500">Driving Side</div>
                    <div className="font-medium text-gray-800 flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className={country.driving_side === 'left' ? 'text-purple-600' : 'text-blue-600'}>
                        {country.driving_side ? country.driving_side.charAt(0).toUpperCase() + country.driving_side.slice(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Phone Prefix */}
                  <div>
                    <div className="text-sm text-gray-500">Phone Code</div>
                    <div className="font-medium text-gray-800 flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {country.phone_prefix || 'N/A'}
                    </div>
                  </div>
                  
                  {/* Domains */}
                  <div>
                    <div className="text-sm text-gray-500">Internet Domains</div>
                    <div className="font-medium text-gray-800 flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {country.domain && country.domain.length > 0 
                        ? country.domain.map(d => `.${d}`).join(', ') 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Currency Card */} 
              {country.currency && country.currency.length > 0 && (
                 <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Currency</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {country.currency.map((curr, idx) => (
                        <div key={idx} className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                            <div className="text-sm font-bold">{curr.symbol}</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{curr.name}</div>
                            <div className="text-sm text-gray-500">{curr.code}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
              )}

              {/* Camera Generation Card */}
              {country.camera_generation && Object.keys(country.camera_generation).length > 0 && (
                 <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Google Street View Coverage</h3>
                    
                    <div className="flex flex-col md:flex-row">
                      {/* Donut chart */}
                      <div className="w-full md:w-1/2 flex justify-center items-center mb-4 md:mb-0">
                        {(() => {
                          const chartData = parseCameraData(country.camera_generation);
                          if (!chartData) return null;
                          
                          return (
                            <div className="w-[200px] h-[200px]">
                              <Doughnut 
                                data={{
                                  labels: chartData.labels.map(label => label.toLowerCase().startsWith('gen') 
                                    ? `Generation ${label.replace(/^gen/i, '')}` 
                                    : label),
                                  datasets: [
                                    {
                                      data: chartData.values,
                                      backgroundColor: chartData.colors,
                                      borderColor: chartData.colors.map(color => color.replace('0.8', '1')),
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  plugins: {
                                    legend: {
                                      position: 'right',
                                      labels: {
                                        font: {
                                          size: 12,
                                        },
                                        boxWidth: 15,
                                      },
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: (context) => `${context.label}: ${context.raw}%`,
                                      },
                                    },
                                  },
                                  cutout: '70%',
                                }}
                              />
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Generation data table */}
                      <div className="w-full md:w-1/2">
                        {(() => {
                          const data = parseCameraData(country.camera_generation);
                          if (!data) return null;
                          
                          return (
                            <div className="grid grid-cols-2 gap-4">
                              {data.labels.map((label, index) => (
                                <div key={label} className="flex flex-col">
                                  <div className="text-sm text-gray-500">
                                    {label.toLowerCase().startsWith('gen') 
                                      ? `Generation ${label.replace(/^gen/i, '')}`
                                      : label}
                                  </div>
                                  <div className="font-medium text-gray-800 mt-1 text-lg">
                                    <span 
                                      className="px-2 py-1 rounded-lg" 
                                      style={{ backgroundColor: data.colors[index].replace('0.8', '0.2') }}
                                    >
                                      {data.values[index]}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                 </div>
              )}
            </div>{/* End Info Cards Column */} 

            {/* Conditionally render Map for compact view IN THIS COLUMN */}
            {!isFullPage && (
              <div className="w-full h-[250px] bg-gray-50 rounded-lg shadow-sm border border-gray-100">
                <CountryMap countryName={country.name} countryCode={country.code} />
              </div>
            )}
          </div> {/* End Main Grid */} 

          {/* Related Items Container - Placed AFTER grid and compact map */}
          {country.id && (
            <div className="mt-20 space-y-4"> {/* Significantly increased margin from mt-4 to mt-20 for much more separation */}
              {/* Related Bollards Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                 {/* Collapsible Header */}
                 <button 
                   onClick={() => setIsBollardsExpanded(!isBollardsExpanded)}
                   className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
                   disabled={loadingBollards || bollards.length === 0}
                   aria-expanded={isBollardsExpanded}
                 >
                   <h3 className="text-lg font-semibold text-gray-800">
                     Related Bollards 
                     {!loadingBollards && `(${bollards.length})`}
                   </h3>
                   {/* Chevron Icon indicating state */}
                   {!loadingBollards && bollards.length > 0 && (
                      <svg 
                        className={`w-5 h-5 text-gray-500 transition-transform ${isBollardsExpanded ? 'transform rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                   )}
                   {loadingBollards && (
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                   )}
                 </button>
                 
                 {/* Collapsible Content */}
                 {isBollardsExpanded && (
                   <div className="p-4 border-t border-gray-100">
                     {loadingBollards ? (
                       <div className="text-center py-4 text-gray-600">Loading...</div>
                     ) : bollardsError ? (
                       <div className="text-red-600 text-center py-4">{bollardsError}</div>
                     ) : bollards.length > 0 ? (
                       <div className="space-y-2">
                         {bollards.map(bollard => (
                           <button 
                             key={bollard._id} 
                             onClick={() => handleBollardClick(bollard)}
                             className="w-full flex items-center p-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                             aria-label={`View details for bollard ${bollard.description || bollard._id}`}
                           >
                             {/* Image - Increased Size */}
                             <div className="flex-shrink-0 w-32 h-20 bg-gray-100 rounded-sm overflow-hidden mr-4">
                               <img 
                                 src={getImageUrl(bollard.imageUrl)} 
                                 alt={bollard.description || `Bollard ${bollard._id}`} 
                                 className="w-full h-full object-cover" 
                               />      
                             </div>
                             {/* Details */}
                             <div className="flex-grow text-left min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate" title={bollard.description}>{bollard.description || 'Bollard'}</p>
                                {bollard.googleMapsUrl && (
                                  <a 
                                    href={bollard.googleMapsUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()} // Prevent modal open when clicking link
                                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-0.5"
                                  >
                                    <svg className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    Google Maps
                                  </a>
                               )}
                             </div>
                           </button>
                         ))}
                       </div>
                     ) : (
                       <div className="text-gray-500 text-center py-4">No related bollards found for this country.</div>
                     )}
                   </div>
                 )}
              </div>
              
              {/* Related License Plates Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                 {/* Collapsible Header */}
                 <button 
                   onClick={() => setIsPlatesExpanded(!isPlatesExpanded)}
                   className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
                   disabled={loadingPlates || plates.length === 0}
                   aria-expanded={isPlatesExpanded}
                 >
                   <h3 className="text-lg font-semibold text-gray-800">
                     Related License Plates 
                     {!loadingPlates && `(${plates.length})`}
                   </h3>
                   {!loadingPlates && plates.length > 0 && (
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${isPlatesExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                   )}
                   {loadingPlates && (
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                   )}
                 </button>
                 
                 {/* Collapsible Content */}
                 {isPlatesExpanded && (
                   <div className="p-4 border-t border-gray-100">
                     {loadingPlates ? (
                       <div className="text-center py-4 text-gray-600">Loading...</div>
                     ) : platesError ? (
                       <div className="text-red-600 text-center py-4">{platesError}</div>
                     ) : plates.length > 0 ? (
                       <div className="space-y-2">
                         {plates.map(plate => (
                           <button 
                             key={plate._id} 
                             onClick={() => handlePlateClick(plate)}
                             className="w-full flex items-center p-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                             aria-label={`View details for license plate ${plate.description || plate._id}`}
                           >
                             {/* Image - Increased Size */}
                             <div className="flex-shrink-0 w-32 h-20 bg-gray-100 rounded-sm overflow-hidden mr-4 flex items-center justify-center">
                               <img 
                                 src={getImageUrl(plate.imageUrl)} 
                                 alt={plate.description || `License Plate ${plate._id}`} 
                                 className="max-w-full max-h-full object-contain" // Use object-contain for plates
                               />      
                             </div>
                             {/* Details */}
                             <div className="flex-grow text-left min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate" title={plate.description}>{plate.description || 'License Plate'}</p>
                                {/* Optional preview of other details */}
                                {plate.format && (
                                  <span className="text-xs text-gray-500 block mt-0.5">
                                    Format: {plate.format}
                                  </span>
                                )}
                             </div>
                           </button>
                         ))}
                       </div>
                     ) : (
                       <div className="text-gray-500 text-center py-4">No related license plates found.</div>
                     )}
                   </div>
                 )}
              </div>
              
              {/* Related Road Signs Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                 {/* Collapsible Header */}
                 <button 
                   onClick={() => setIsSignsExpanded(!isSignsExpanded)}
                   className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
                   disabled={loadingSigns || signs.length === 0}
                   aria-expanded={isSignsExpanded}
                 >
                   <h3 className="text-lg font-semibold text-gray-800">
                     Related Road Signs 
                     {!loadingSigns && `(${signs.length})`}
                   </h3>
                   {!loadingSigns && signs.length > 0 && (
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${isSignsExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                   )}
                   {loadingSigns && (
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                   )}
                 </button>
                 
                 {/* Collapsible Content */}
                 {isSignsExpanded && (
                   <div className="p-4 border-t border-gray-100">
                     {loadingSigns ? (
                       <div className="text-center py-4 text-gray-600">Loading...</div>
                     ) : signsError ? (
                       <div className="text-red-600 text-center py-4">{signsError}</div>
                     ) : signs.length > 0 ? (
                       <div className="space-y-2">
                         {signs.map(sign => (
                           <button 
                             key={sign._id} 
                             onClick={() => handleSignClick(sign)}
                             className="w-full flex items-center p-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                             aria-label={`View details for road sign ${sign.description || sign._id}`}
                           >
                             {/* Image - Increased Size */}
                             <div className="flex-shrink-0 w-32 h-20 bg-gray-100 rounded-sm overflow-hidden mr-4 flex items-center justify-center">
                               <img 
                                 src={getImageUrl(sign.imageUrl)} 
                                 alt={sign.description || `Road Sign ${sign._id}`} 
                                 className="max-w-full max-h-full object-contain" // Use object-contain for signs
                               />      
                             </div>
                             {/* Details */}
                             <div className="flex-grow text-left min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate" title={sign.description}>{sign.description || 'Road Sign'}</p>
                                {/* Display types if available */}
                                <div className="flex items-center mt-0.5 gap-1 flex-wrap">
                                  {sign.types && sign.types.length > 0 && (
                                    sign.types.map(type => (
                                      <span key={type} className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full capitalize">
                                        {type}
                                      </span>
                                    ))
                                  )}
                                  {/* Google Maps Link */}
                                  {sign.googleMapsUrl && (
                                    <a 
                                      href={sign.googleMapsUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()} // Prevent modal open
                                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      <svg className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                      Map
                                    </a>
                                  )}
                                </div>
                             </div>
                           </button>
                         ))}
                       </div>
                     ) : (
                       <div className="text-gray-500 text-center py-4">No related road signs found.</div>
                     )}
                   </div>
                 )}
              </div>

              {/* Related Languages Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                 {/* Collapsible Header */}
                 <button 
                   onClick={() => setIsLanguagesExpanded(!isLanguagesExpanded)}
                   className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
                   disabled={loadingLanguages || languages.length === 0}
                   aria-expanded={isLanguagesExpanded}
                 >
                   <h3 className="text-lg font-semibold text-gray-800">
                     Related Languages 
                     {!loadingLanguages && `(${languages.length})`}
                   </h3>
                   {!loadingLanguages && languages.length > 0 && (
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${isLanguagesExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                   )}
                   {loadingLanguages && (
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                   )}
                 </button>
                 
                 {/* Collapsible Content */} 
                 {isLanguagesExpanded && (
                   <div className="p-4 border-t border-gray-100">
                     {loadingLanguages ? (
                       <div className="text-center py-4 text-gray-600">Loading...</div>
                     ) : languagesError ? (
                       <div className="text-red-600 text-center py-4">{languagesError}</div>
                     ) : languages.length > 0 ? (
                       <div className="space-y-2">
                         {languages.map(language => (
                           <button 
                             key={language._id} 
                             onClick={() => handleLanguageClick(language)}
                             className="w-full flex items-center p-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                             aria-label={`View details for language ${language.description || language._id}`}
                           >
                             {/* Image */} 
                             <div className="flex-shrink-0 w-32 h-20 bg-gray-100 rounded-sm overflow-hidden mr-4 flex items-center justify-center">
                               <img 
                                 src={getImageUrl(language.imageUrl)} 
                                 alt={language.description || `Language ${language._id}`}
                                 className="max-w-full max-h-full object-contain" 
                               />      
                             </div>
                             {/* Details */} 
                             <div className="flex-grow text-left min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate" title={language.description}>{language.description || 'Language/Script'}</p>
                                {/* Optionally add more details here if needed */}
                             </div>
                           </button>
                         ))}
                       </div>
                     ) : (
                       <div className="text-gray-500 text-center py-4">No related languages found.</div>
                     )}
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals - Placed outside the main content flow */}
      {/* Bollard Detail Modal */}
      {selectedBollard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm" onClick={closeModal}>
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Bollard Details</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <img 
                  src={getImageUrl(selectedBollard.imageUrl)} 
                  alt={`Bollard in ${country.name}`}
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
                    <span>{country.name}</span>
                  </span>
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
      
      {/* License Plate Detail Modal */}
      {selectedPlate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">License Plate Details</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <img 
                  src={getImageUrl(selectedPlate.imageUrl)} 
                  alt={`License plate in ${country.name}`}
                  className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/images/placeholder.png';
                  }}
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
              
              <div className="mt-6 text-center text-sm text-gray-500">
                Press ESC key or click outside to close
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Road Sign Detail Modal */}
      {selectedSign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Road Sign Details</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <img 
                  src={getImageUrl(selectedSign.imageUrl)} 
                  alt={`Road sign in ${country.name}`}
                  className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/images/placeholder.png';
                  }}
                />
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedSign.description}</p>
              </div>
              
              {selectedSign.types && selectedSign.types.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSign.types.map((type) => (
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
              
              <div className="mt-6 text-center text-sm text-gray-500">
                Press ESC key or click outside to close
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Detail Modal */} 
      {selectedLanguage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Language/Script Details</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <img 
                  src={getImageUrl(selectedLanguage.imageUrl)} 
                  alt={`Language script/image for ${selectedLanguage.description}`}
                  className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                />
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedLanguage.description || 'No description available.'}</p>
              </div>
              
              {/* Countries section */} 
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Countries where this language/script is primarily used</h4>
                {loadingLanguageCountries ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-gray-500">Loading countries...</span>
                  </div>
                ) : languageCountries.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {languageCountries.map(country => (
                      <div key={country._id} className="bg-gray-50 p-2 rounded flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{country.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No country information available.</p>
                )}
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

export default CountryInfoCard;
