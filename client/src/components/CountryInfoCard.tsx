import React, { useEffect, useState } from 'react';
import CountryMap from './CountryMap';
import BollardGallery from './BollardGallery';
import { fetchCountryDetails, fetchBollardsByCountry, CountryInfo, Bollard } from '../services/countryService';

interface CountryInfoCardProps {
  country: CountryInfo;
  isVisible: boolean;
}

const CountryInfoCard: React.FC<CountryInfoCardProps> = ({ country, isVisible }) => {
  const [countryDetails, setCountryDetails] = useState<CountryInfo>(country);
  const [loading, setLoading] = useState<boolean>(false);
  const [bollards, setBollards] = useState<Bollard[]>([]);
  const [loadingBollards, setLoadingBollards] = useState<boolean>(false);
  const [showBollards, setShowBollards] = useState<boolean>(true);

  useEffect(() => {
    const getCountryDetails = async () => {
      if (isVisible && country.name) {
        setLoading(true);
        try {
          // If we already have the capital, we don't need to fetch it again
          if (country.capital && country.continent && country.code) {
            setCountryDetails({
              ...country
            });
          } else {
            const details = await fetchCountryDetails(country.name, country.flagUrl);
            setCountryDetails(details);
          }
        } catch (error) {
          console.error('Error fetching country details:', error);
          // If there's an error, still use what we have
          setCountryDetails(country);
        } finally {
          setLoading(false);
        }
      }
    };

    getCountryDetails();
  }, [isVisible, country]);

  // Fetch bollards when country ID is available and bollards section is expanded
  useEffect(() => {
    const getBollards = async () => {
      if (showBollards && countryDetails.id) {
        setLoadingBollards(true);
        try {
          const bollardData = await fetchBollardsByCountry(countryDetails.id);
          setBollards(bollardData);
        } catch (error) {
          console.error('Error fetching bollards:', error);
        } finally {
          setLoadingBollards(false);
        }
      }
    };

    getBollards();
  }, [showBollards, countryDetails.id]);

  if (!isVisible) return null;
  
  // Get continent color
  const getContinentColor = (continent?: string) => {
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

  // Format country code for display
  const formatCountryCode = (code?: string) => {
    return code ? code.toUpperCase() : 'N/A';
  };
  
  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 animate-fadeIn">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4">
        <h3 className="text-xl font-bold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {countryDetails.name}
        </h3>
        {countryDetails.code && (
          <div className="text-sm text-blue-100 mt-1">
            Country Code: {formatCountryCode(countryDetails.code)}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left column with flag */}
            {countryDetails.flagUrl && (
              <div className="md:w-1/3">
                <div className="rounded-lg overflow-hidden shadow-md border border-gray-200">
                  <img 
                    src={countryDetails.flagUrl} 
                    alt={`Flag of ${countryDetails.name}`} 
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  Flag of {countryDetails.name}
                </div>
              </div>
            )}
            
            {/* Right column with details */}
            <div className="md:w-2/3 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Capital */}
                <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                  <div className="text-gray-500 text-sm mb-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Capital
                  </div>
                  <div className="font-semibold text-lg">{countryDetails.capital || 'Unknown'}</div>
                </div>
                
                {/* Continent */}
                <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                  <div className="text-gray-500 text-sm mb-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Continent
                  </div>
                  {countryDetails.continent ? (
                    <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getContinentColor(countryDetails.continent)}`}>
                      {countryDetails.continent}
                    </span>
                  ) : (
                    <div className="font-semibold text-lg">Unknown</div>
                  )}
                </div>
                
                {/* GeoGuessr Status */}
                <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                  <div className="text-gray-500 text-sm mb-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    In GeoGuessr
                  </div>
                  <div className="font-semibold text-lg flex items-center">
                    {countryDetails.in_geoguessr ? (
                      <span className="text-green-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Yes
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        No
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Map section */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Location
            </h4>
            <div className="rounded-lg overflow-hidden shadow-md">
              <CountryMap countryName={countryDetails.name} />
            </div>
          </div>
          
          {/* Bollards section */}
          <div className="mt-6">
            <button 
              onClick={() => setShowBollards(!showBollards)}
              className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold">Bollards in {countryDetails.name}</span>
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transition-transform ${showBollards ? 'transform rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showBollards && (
              <div className="mt-4">
                <BollardGallery bollards={bollards} isLoading={loadingBollards} />
              </div>
            )}
          </div>
          
          {/* Fun fact */}
          <div className="mt-4 bg-blue-50 p-3 rounded-lg text-sm text-blue-800 italic flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Learn more about {countryDetails.name} by exploring its geography, culture, and history.
              {countryDetails.capital && ` The capital city is ${countryDetails.capital}.`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryInfoCard;
