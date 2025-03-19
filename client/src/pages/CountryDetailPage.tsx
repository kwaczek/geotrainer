import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import CountryMap from '../components/CountryMap';
import BollardGallery from '../components/BollardGallery';
import LicensePlateGallery from '../components/LicensePlateGallery';
import { Bollard, LicensePlate } from '../services/countryService';

interface CountryDetails {
  id: string;
  name: string;
  capital: string;
  continent: string;
  code: string;
  flagUrl: string;
  in_geoguessr: boolean;
}

// Fallback data for demonstration if database is unavailable
const fallbackCountryDetails: Record<string, CountryDetails> = {
  'usa': {
    id: 'usa',
    name: 'United States',
    capital: 'Washington D.C.',
    continent: 'North America',
    code: 'us',
    flagUrl: 'https://flagcdn.com/w320/us.png',
    in_geoguessr: true
  },
  'germany': {
    id: 'germany',
    name: 'Germany',
    capital: 'Berlin',
    continent: 'Europe',
    code: 'de',
    flagUrl: 'https://flagcdn.com/w320/de.png',
    in_geoguessr: true
  }
};

const fallbackBollards: Bollard[] = [
  {
    _id: 'bollard1',
    imageUrl: 'https://i.imgur.com/example1.jpg',
    description: 'Sample bollard in urban area (demo data)',
    googleMapsUrl: 'https://maps.google.com',
    countries: ['usa', 'germany'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const fallbackLicensePlates: LicensePlate[] = [
  {
    _id: 'plate1',
    imageUrl: 'https://i.imgur.com/example1.jpg',
    description: 'Sample license plate (demo data)',
    countries: ['usa'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const CountryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [country, setCountry] = useState<CountryDetails | null>(null);
  const [bollards, setBollards] = useState<Bollard[]>([]);
  const [licensePlates, setLicensePlates] = useState<LicensePlate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showBollards, setShowBollards] = useState<boolean>(true);
  const [showLicensePlates, setShowLicensePlates] = useState<boolean>(true);
  const [loadingBollards, setLoadingBollards] = useState<boolean>(false);
  const [loadingLicensePlates, setLoadingLicensePlates] = useState<boolean>(false);
  const [usingFallbackData, setUsingFallbackData] = useState<boolean>(false);

  // Set document title
  useDocumentTitle(country ? `${country.name} | Countries` : 'Country Details', false);

  // Fetch country details on mount or when ID changes
  useEffect(() => {
    const fetchCountry = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`/api/countries/${id}`);
        if (response.data.success) {
          setCountry(response.data.country);
        } else {
          // Try to use fallback data if available
          if (fallbackCountryDetails[id]) {
            console.warn('Database unavailable, using fallback data for country');
            setCountry(fallbackCountryDetails[id]);
            setUsingFallbackData(true);
          } else {
            setError('Failed to fetch country details');
          }
        }
      } catch (error) {
        console.error('Error fetching country details:', error);
        
        // Try to use fallback data if available
        if (fallbackCountryDetails[id]) {
          console.warn('Database unavailable, using fallback data for country');
          setCountry(fallbackCountryDetails[id]);
          setUsingFallbackData(true);
        } else {
          setError('An error occurred while fetching country details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCountry();
  }, [id]);

  // Fetch bollards when country ID is available and bollards section is expanded
  useEffect(() => {
    const fetchBollards = async () => {
      if (showBollards && id) {
        setLoadingBollards(true);
        try {
          const response = await axios.get(`/api/bollards/country/${id}`);
          if (response.data.success) {
            setBollards(response.data.bollards);
          } else if (usingFallbackData) {
            setBollards(fallbackBollards);
          }
        } catch (error) {
          console.error('Error fetching bollards:', error);
          if (usingFallbackData) {
            setBollards(fallbackBollards);
          }
        } finally {
          setLoadingBollards(false);
        }
      }
    };

    fetchBollards();
  }, [showBollards, id, usingFallbackData]);

  // Fetch license plates when country ID is available and license plates section is expanded
  useEffect(() => {
    const fetchLicensePlates = async () => {
      if (showLicensePlates && id) {
        setLoadingLicensePlates(true);
        try {
          const response = await axios.get(`/api/licenseplates/country/${id}`);
          if (response.data.success) {
            setLicensePlates(response.data.licensePlates);
          } else if (usingFallbackData) {
            setLicensePlates(fallbackLicensePlates);
          }
        } catch (error) {
          console.error('Error fetching license plates:', error);
          if (usingFallbackData) {
            setLicensePlates(fallbackLicensePlates);
          }
        } finally {
          setLoadingLicensePlates(false);
        }
      }
    };

    fetchLicensePlates();
  }, [showLicensePlates, id, usingFallbackData]);

  // Get continent color
  const getContinentColor = (continent: string) => {
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

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading country details...</p>
      </div>
    );
  }

  // Error state
  if (error || !country) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error || 'Country not found'}</p>
          <Link to="/countries">
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Back to Countries
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Fallback data warning */}
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
                Database connection unavailable. Showing sample data for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm">
        <Link to="/countries" className="text-blue-600 hover:text-blue-800">
          Countries
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-600">{country.name}</span>
      </nav>

      {/* Country Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-lg p-6 text-white">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            {country.flagUrl && (
              <img 
                src={country.flagUrl} 
                alt={`Flag of ${country.name}`} 
                className="w-16 h-auto rounded shadow-lg mr-4 hidden md:block"
                onError={(e) => {
                  // Fallback for broken flag images
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/images/flag-placeholder.png';
                }}
              />
            )}
            <h1 className="text-3xl font-bold">{country.name}</h1>
          </div>
          
          <div className="flex flex-col items-end">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getContinentColor(country.continent)}`}>
              {country.continent}
            </span>
            {country.code && (
              <span className="text-sm mt-2 bg-blue-900 bg-opacity-30 px-2 py-1 rounded">
                Code: {country.code.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-md rounded-b-lg overflow-hidden mb-8">
        {/* Flag for mobile */}
        <div className="md:hidden p-4 flex justify-center">
          {country.flagUrl && (
            <div className="w-full max-w-xs">
              <img 
                src={country.flagUrl} 
                alt={`Flag of ${country.name}`} 
                className="w-full h-auto rounded-lg shadow border border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/images/flag-placeholder.png';
                }}
              />
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div>
            <div className="grid grid-cols-1 gap-4">
              {/* Capital */}
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Capital</h3>
                    <p className="text-lg font-semibold">{country.capital || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* GeoGuessr Status */}
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">GeoGuessr Status</h3>
                    <div className="flex items-center mt-1">
                      {country.in_geoguessr ? (
                        <span className="text-green-600 flex items-center font-medium">
                          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Available in GeoGuessr
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center font-medium">
                          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Not in GeoGuessr
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Flag for desktop */}
          <div className="hidden md:block">
            {country.flagUrl && (
              <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200 h-full flex items-center justify-center bg-gray-50">
                <img 
                  src={country.flagUrl} 
                  alt={`Flag of ${country.name}`} 
                  className="max-w-full max-h-60 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/images/flag-placeholder.png';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Map section */}
        <div className="p-6 border-t border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Map</h2>
          <div className="h-64 rounded-lg overflow-hidden bg-gray-100 shadow-inner">
            <CountryMap countryName={country.name} />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Map data showing the location of {country.name}
          </p>
        </div>
      </div>

      {/* Bollards section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <button 
          onClick={() => setShowBollards(!showBollards)}
          className="w-full flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
        >
          <div className="flex items-center">
            <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-xl font-bold text-gray-800">Bollards in {country.name}</span>
          </div>
          <svg 
            className={`h-5 w-5 text-gray-500 transition-transform ${showBollards ? 'transform rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showBollards && (
          <div className="p-6">
            <BollardGallery bollards={bollards} isLoading={loadingBollards} />
          </div>
        )}
      </div>

      {/* License Plates section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <button 
          onClick={() => setShowLicensePlates(!showLicensePlates)}
          className="w-full flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
        >
          <div className="flex items-center">
            <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
            </svg>
            <span className="text-xl font-bold text-gray-800">License Plates in {country.name}</span>
          </div>
          <svg 
            className={`h-5 w-5 text-gray-500 transition-transform ${showLicensePlates ? 'transform rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showLicensePlates && (
          <div className="p-6">
            <LicensePlateGallery licensePlates={licensePlates} isLoading={loadingLicensePlates} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link to="/countries">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Countries
          </button>
        </Link>
      </div>
    </div>
  );
};

export default CountryDetailPage; 