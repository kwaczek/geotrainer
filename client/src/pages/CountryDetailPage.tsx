import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import CountryInfoCard from '../components/CountryInfoCard';

interface ICurrency {
  name: string;
  symbol: string;
  code: string;
}

interface CountryDetails {
  id: string;
  name: string;
  capital: string;
  continent: string;
  in_geoguessr: boolean;
  code?: string;
  flagUrl?: string;
  domain?: string[];
  currency?: ICurrency[];
  population?: number;
  area?: number;
  phone_prefix?: string;
  driving_side?: 'left' | 'right';
  camera_generation?: Record<string, string>;
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
    in_geoguessr: true,
    population: 331002651,
    area: 9833520,
    domain: ['us', 'gov', 'edu', 'mil'],
    currency: [{ name: 'US Dollar', symbol: '$', code: 'USD' }],
    phone_prefix: '+1',
    driving_side: 'right'
  },
  'germany': {
    id: 'germany',
    name: 'Germany',
    capital: 'Berlin',
    continent: 'Europe',
    code: 'de',
    flagUrl: 'https://flagcdn.com/w320/de.png',
    in_geoguessr: true,
    population: 83783942,
    area: 357022,
    domain: ['de'],
    currency: [{ name: 'Euro', symbol: '€', code: 'EUR' }],
    phone_prefix: '+49',
    driving_side: 'right'
  }
};

const CountryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [country, setCountry] = useState<CountryDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState<boolean>(false);

  // Set document title
  useDocumentTitle(country ? `${country.name} | Countries` : 'Country Details', false);

  // Fetch country details on mount or when ID changes
  useEffect(() => {
    const fetchCountry = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        console.log('Fetching country with ID:', id);
        const response = await axios.get(`/api/countries/${id}`);
        console.log('API Response:', response.data);
        
        if (response.data && response.data.success) {
          // Ensure we have a flagUrl
          const countryData = response.data.country;
          console.log('Raw country data from API:', countryData);
          
          if (!countryData.flagUrl && countryData.code) {
            countryData.flagUrl = `https://flagcdn.com/w320/${countryData.code.toLowerCase()}.png`;
            console.log('Added flag URL:', countryData.flagUrl);
          }
          
          // Check if all fields are present
          console.log('Country data fields:', Object.keys(countryData));
          console.log('Population:', countryData.population);
          console.log('Area:', countryData.area);
          console.log('Currency:', countryData.currency);
          console.log('Domain:', countryData.domain);
          console.log('Phone Prefix:', countryData.phone_prefix);
          console.log('Driving Side:', countryData.driving_side);
          console.log('Camera Generation:', countryData.camera_generation);
          
          setCountry(countryData);
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

      {/* Use CountryInfoCard with isFullPage=true */}
      <CountryInfoCard 
        country={country} 
        isVisible={true} 
        isFullPage={true} 
      />

      {/* Navigation */}
      <div className="flex justify-between mt-8">
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