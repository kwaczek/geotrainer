import React, { useState, useEffect } from 'react';
import CountryMap from './CountryMap';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {
  fetchBollardsByCountry, Bollard as BaseBollard,
  fetchLicensePlatesByCountry, LicensePlate as BaseLicensePlate,
  fetchRoadSignsByCountry, RoadSign as BaseRoadSign
} from '../services/countryService';
import { getImageUrl } from '../config/apiConfig';

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
  
  // State for selected items for modals
  const [selectedBollard, setSelectedBollard] = useState<Bollard | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<LicensePlate | null>(null);
  const [selectedSign, setSelectedSign] = useState<RoadSign | null>(null);
  
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

  // Handlers to open modals
  const handleBollardClick = (bollard: Bollard) => setSelectedBollard(bollard);
  const handlePlateClick = (plate: LicensePlate) => setSelectedPlate(plate);
  const handleSignClick = (sign: RoadSign) => setSelectedSign(sign);

  // Handlers to close modals
  const closeModal = () => {
    setSelectedBollard(null);
    setSelectedPlate(null);
    setSelectedSign(null);
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
            </div>
          )}
        </div>
      </div>

      {/* Modals - Placed outside the main content flow */}
      {/* Bollard Detail Modal */}
      {selectedBollard && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm" onClick={closeModal}>
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedBollard.description || 'Bollard Detail'}
              </h3>
              <button 
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="w-full md:w-1/2">
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={getImageUrl(selectedBollard.imageUrl)} 
                      alt={selectedBollard.description || 'Bollard'} 
                      className="w-full h-auto object-contain max-h-[500px]" 
                    />
                  </div>
                </div>
                
                {/* Details */}
                <div className="w-full md:w-1/2 space-y-4">
                  {/* Description */}
                  {selectedBollard.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Description</h4>
                      <p className="text-gray-800 mt-1">{selectedBollard.description}</p>
                    </div>
                  )}
                  
                  {/* Location */}
                  {selectedBollard?.location && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Location</h4>
                      <p className="text-gray-800 mt-1">{selectedBollard.location}</p>
                    </div>
                  )}
                  
                  {/* Notes */}
                  {selectedBollard?.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                      <p className="text-gray-800 mt-1">{selectedBollard.notes}</p>
                    </div>
                  )}
                  
                  {/* Google Maps Link */}
                  {selectedBollard.googleMapsUrl && (
                    <div className="mt-4">
                      <a 
                        href={selectedBollard.googleMapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        View on Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* License Plate Detail Modal */}
      {selectedPlate && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm" onClick={closeModal}>
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedPlate.description || 'License Plate Detail'}
              </h3>
              <button 
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="w-full md:w-1/2">
                  <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-4">
                    <img 
                      src={getImageUrl(selectedPlate.imageUrl)} 
                      alt={selectedPlate.description || 'License Plate'} 
                      className="max-w-full max-h-[400px] object-contain" 
                    />
                  </div>
                </div>
                
                {/* Details */}
                <div className="w-full md:w-1/2 space-y-4">
                  {/* Description */}
                  {selectedPlate.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Description</h4>
                      <p className="text-gray-800 mt-1">{selectedPlate.description}</p>
                    </div>
                  )}
                  
                  {/* Format */}
                  {selectedPlate?.format && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Format</h4>
                      <p className="text-gray-800 mt-1">{selectedPlate.format}</p>
                    </div>
                  )}
                  
                  {/* Years */}
                  {selectedPlate?.years && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Years</h4>
                      <p className="text-gray-800 mt-1">{selectedPlate.years}</p>
                    </div>
                  )}
                  
                  {/* Notes */}
                  {selectedPlate?.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                      <p className="text-gray-800 mt-1">{selectedPlate.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Road Sign Detail Modal */}
      {selectedSign && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm" onClick={closeModal}>
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedSign.description || 'Road Sign Detail'}
              </h3>
              <button 
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="w-full md:w-1/2">
                  <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-4">
                    <img 
                      src={getImageUrl(selectedSign.imageUrl)} 
                      alt={selectedSign.description || 'Road Sign'} 
                      className="max-w-full max-h-[400px] object-contain" 
                    />
                  </div>
                </div>
                
                {/* Details */}
                <div className="w-full md:w-1/2 space-y-4">
                  {/* Description */}
                  {selectedSign.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Description</h4>
                      <p className="text-gray-800 mt-1">{selectedSign.description}</p>
                    </div>
                  )}
                  
                  {/* Types */}
                  {selectedSign.types && selectedSign.types.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Type</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedSign.types.map((type, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm capitalize"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Meaning */}
                  {selectedSign?.meaning && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Meaning</h4>
                      <p className="text-gray-800 mt-1">{selectedSign.meaning}</p>
                    </div>
                  )}
                  
                  {/* Notes */}
                  {selectedSign?.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                      <p className="text-gray-800 mt-1">{selectedSign.notes}</p>
                    </div>
                  )}
                  
                  {/* Google Maps Link */}
                  {selectedSign.googleMapsUrl && (
                    <div className="mt-4">
                      <a 
                        href={selectedSign.googleMapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        View on Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryInfoCard;
