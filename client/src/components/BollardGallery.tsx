import React, { useState, useEffect, useCallback } from 'react';
import { Bollard } from '../services/countryService';
import axios from 'axios';
import { getImageUrl } from '../config/apiConfig';

interface BollardGalleryProps {
  bollards: Bollard[];
  isLoading: boolean;
}

interface CountryDetails {
  _id: string;
  name: string;
}

const BollardGallery: React.FC<BollardGalleryProps> = ({ bollards, isLoading }) => {
  const [selectedBollard, setSelectedBollard] = useState<Bollard | null>(null);
  const [bollardCountries, setBollardCountries] = useState<CountryDetails[]>([]);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(false);

  // Create a memoized closeModal function
  const closeModal = useCallback(() => {
    setSelectedBollard(null);
  }, []);

  // Add event listener for Escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedBollard) {
        closeModal();
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
  }, [selectedBollard, closeModal]);

  // Fetch countries for the selected bollard
  useEffect(() => {
    const fetchBollardCountries = async () => {
      if (selectedBollard && selectedBollard.countries.length > 0) {
        setLoadingCountries(true);
        try {
          // Create an array of promises for each country ID
          const countryPromises = selectedBollard.countries.map(countryId => 
            axios.get(`/api/countries/${countryId}`)
          );
          
          // Wait for all promises to resolve
          const responses = await Promise.all(countryPromises);
          
          // Extract country data from responses
          const countries = responses
            .filter(response => response.data && response.data.success)
            .map(response => response.data.country);
          
          setBollardCountries(countries);
        } catch (error) {
          console.error('Error fetching bollard countries:', error);
        } finally {
          setLoadingCountries(false);
        }
      }
    };

    fetchBollardCountries();
  }, [selectedBollard]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (bollards.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No bollards found</h3>
        <p className="mt-1 text-sm text-gray-500">There are no bollards associated with this country yet.</p>
      </div>
    );
  }

  const openModal = (bollard: Bollard) => {
    setSelectedBollard(bollard);
    setBollardCountries([]);
  };

  return (
    <div>
      <div className="space-y-4">
        {bollards.map((bollard) => (
          <div 
            key={bollard._id} 
            className="bg-gray-50 rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              {bollard.imageUrl && (
                <img 
                  src={bollard.imageUrl} 
                  alt={bollard.description || 'Bollard image'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/images/placeholder.png';
                  }}
                />
              )}
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">{bollard.description || 'No description available'}</p>
              
              {bollard.googleMapsUrl && (
                <a 
                  href={bollard.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on Google Maps
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal for displaying bollard details */}
      {selectedBollard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
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
                  alt={`Bollard in ${selectedBollard.description}`}
                  className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                />
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedBollard.description}</p>
              </div>
              
              {/* Countries section */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Countries where this bollard can be found</h4>
                {loadingCountries ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-gray-500">Loading countries...</span>
                  </div>
                ) : bollardCountries.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {bollardCountries.map(country => (
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

export default BollardGallery; 