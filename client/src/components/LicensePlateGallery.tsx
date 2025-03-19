import React, { useState, useEffect, useCallback } from 'react';
import { LicensePlate } from '../services/countryService';
import axios from 'axios';
import { getImageUrl } from '../config/apiConfig';

interface LicensePlateGalleryProps {
  licensePlates: LicensePlate[];
  isLoading: boolean;
}

interface CountryDetails {
  _id: string;
  name: string;
}

const LicensePlateGallery: React.FC<LicensePlateGalleryProps> = ({ licensePlates, isLoading }) => {
  const [selectedLicensePlate, setSelectedLicensePlate] = useState<LicensePlate | null>(null);
  const [licensePlateCountries, setLicensePlateCountries] = useState<CountryDetails[]>([]);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(false);

  // Create a memoized closeModal function
  const closeModal = useCallback(() => {
    setSelectedLicensePlate(null);
  }, []);

  // Add event listener for Escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedLicensePlate) {
        closeModal();
      }
    };

    // Add event listener when modal is open
    if (selectedLicensePlate) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedLicensePlate, closeModal]);

  // Fetch countries for the selected license plate
  useEffect(() => {
    const fetchLicensePlateCountries = async () => {
      if (selectedLicensePlate && selectedLicensePlate.countries.length > 0) {
        setLoadingCountries(true);
        try {
          // Create an array of promises for each country ID
          const countryPromises = selectedLicensePlate.countries.map(countryId => 
            axios.get(`/api/countries/${countryId}`)
          );
          
          // Wait for all promises to resolve
          const responses = await Promise.all(countryPromises);
          
          // Extract country data from responses
          const countries = responses
            .filter(response => response.data && response.data.success)
            .map(response => response.data.country);
          
          setLicensePlateCountries(countries);
        } catch (error) {
          console.error('Error fetching license plate countries:', error);
        } finally {
          setLoadingCountries(false);
        }
      }
    };

    fetchLicensePlateCountries();
  }, [selectedLicensePlate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (licensePlates.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No license plates found</h3>
        <p className="mt-1 text-sm text-gray-500">There are no license plates associated with this country yet.</p>
      </div>
    );
  }

  const openModal = (licensePlate: LicensePlate) => {
    setSelectedLicensePlate(licensePlate);
    setLicensePlateCountries([]);
  };

  return (
    <div>
      <div className="space-y-4">
        {licensePlates.map((licensePlate) => (
          <div 
            key={licensePlate._id} 
            className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row">
              {/* Image column */}
              <div 
                className="md:w-1/3 cursor-pointer"
                onClick={() => openModal(licensePlate)}
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  {licensePlate.imageUrl && (
                    <img 
                      src={licensePlate.imageUrl} 
                      alt={licensePlate.description || 'License plate image'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/images/placeholder.png';
                      }}
                    />
                  )}
                </div>
              </div>
              
              {/* Details column */}
              <div className="p-4 md:w-2/3">
                <h3 className="font-semibold text-gray-800 mb-2">License Plate Details</h3>
                <p className="text-gray-600 mb-3">{licensePlate.description || 'No description available'}</p>
                
                <div className="mt-3">
                  <button
                    onClick={() => openModal(licensePlate)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for displaying license plate details */}
      {selectedLicensePlate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={closeModal}>
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
                  src={getImageUrl(selectedLicensePlate.imageUrl)} 
                  alt={`License plate in ${selectedLicensePlate.description}`}
                  className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                />
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedLicensePlate.description || 'No description available'}</p>
              </div>
              
              {/* Countries section */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Countries where this license plate can be found</h4>
                {loadingCountries ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-gray-500">Loading countries...</span>
                  </div>
                ) : licensePlateCountries.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {licensePlateCountries.map(country => (
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

export default LicensePlateGallery; 