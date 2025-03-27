import React, { useState, useEffect, useCallback } from 'react';
import { RoadSign } from '../services/countryService';
import { getImageUrl } from '../config/apiConfig';

interface RoadSignGalleryProps {
  roadSigns: RoadSign[];
  isLoading: boolean;
}

interface CountryDetails {
  _id: string;
  name: string;
  code?: string;
  flagUrl?: string;
}

const RoadSignGallery: React.FC<RoadSignGalleryProps> = ({ roadSigns, isLoading }) => {
  const [selectedRoadSign, setSelectedRoadSign] = useState<RoadSign | null>(null);

  // Create a memoized closeModal function
  const closeModal = useCallback(() => {
    setSelectedRoadSign(null);
  }, []);

  // Add event listener for Escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedRoadSign) {
        closeModal();
      }
    };

    // Add event listener when modal is open
    if (selectedRoadSign) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedRoadSign, closeModal]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (roadSigns.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No road signs found</h3>
        <p className="mt-1 text-sm text-gray-500">There are no road signs associated with this country yet.</p>
      </div>
    );
  }

  const openModal = (roadSign: RoadSign) => {
    setSelectedRoadSign(roadSign);
  };

  // Helper function to extract countries from road sign
  const extractCountries = (roadSign: RoadSign): CountryDetails[] => {
    if (!roadSign.countries || !Array.isArray(roadSign.countries)) {
      return [];
    }
    
    return roadSign.countries.map((country: any) => {
      // If country is already an object with _id and name, return it
      if (typeof country === 'object' && country._id && country.name) {
        return {
          _id: country._id,
          name: country.name,
          code: country.code,
          flagUrl: country.flagUrl
        };
      }
      // Otherwise return a placeholder
      return {
        _id: typeof country === 'string' ? country : String(country),
        name: 'Unknown Country'
      };
    });
  };

  return (
    <div>
      <div className="space-y-4">
        {roadSigns.map((roadSign) => (
          <div 
            key={roadSign._id} 
            className="bg-gray-50 rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openModal(roadSign)}
          >
            <div className="flex">
              <div className="w-48 h-32 flex-shrink-0 bg-gray-200">
                {roadSign.imageUrl && (
                  <img 
                    src={getImageUrl(roadSign.imageUrl)} 
                    alt={roadSign.description || 'Road sign image'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/placeholder.png';
                    }}
                  />
                )}
              </div>
              <div className="flex-1 p-4">
                <p className="text-sm text-gray-600 mb-2">{roadSign.description || 'No description available'}</p>
                
                <div className="flex items-center flex-wrap gap-2">
                  {/* Display types from the array */}
                  {roadSign.types && roadSign.types.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {roadSign.types.map((type) => (
                        <span 
                          key={type} 
                          className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium capitalize"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {roadSign.googleMapsUrl && (
                    <a 
                      href={roadSign.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View on Google Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for displaying road sign details */}
      {selectedRoadSign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={closeModal}>
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
                  src={getImageUrl(selectedRoadSign.imageUrl)} 
                  alt={`Road sign in ${selectedRoadSign.description}`}
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
                <p className="text-gray-600">{selectedRoadSign.description}</p>
              </div>
              
              {/* Countries section */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Countries where this road sign can be found</h4>
                {(() => {
                  const countries = extractCountries(selectedRoadSign);
                  
                  if (countries.length === 0) {
                    return <p className="text-gray-500">No country information available.</p>;
                  }
                  
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      {countries.map(country => (
                        <div key={country._id} className="bg-gray-50 p-2 rounded flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{country.name}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              
              {/* Display types from the array in modal */}
              {selectedRoadSign.types && selectedRoadSign.types.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoadSign.types.map((type) => (
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
              
              {/* Location section - only show if Google Maps URL exists */}
              {selectedRoadSign.googleMapsUrl && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Location</h4>
                  <a 
                    href={selectedRoadSign.googleMapsUrl} 
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

export default RoadSignGallery; 