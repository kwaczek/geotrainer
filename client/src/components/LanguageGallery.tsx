import React, { useState, useEffect, useCallback } from 'react';
import { Language } from '../services/countryService'; // Import Language type
import axios from 'axios';
import { getImageUrl } from '../config/apiConfig';

interface LanguageGalleryProps {
  languages: Language[];
  isLoading: boolean;
}

interface CountryDetails {
  _id: string;
  name: string;
}

const LanguageGallery: React.FC<LanguageGalleryProps> = ({ languages, isLoading }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [languageCountries, setLanguageCountries] = useState<CountryDetails[]>([]);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(false);

  // Create a memoized closeModal function
  const closeModal = useCallback(() => {
    setSelectedLanguage(null);
  }, []);

  // Add event listener for Escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedLanguage) {
        closeModal();
      }
    };

    // Add event listener when modal is open
    if (selectedLanguage) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedLanguage, closeModal]);

  // Fetch countries for the selected language
  useEffect(() => {
    const fetchLanguageCountries = async () => {
      if (selectedLanguage && selectedLanguage.countries.length > 0) {
        setLoadingCountries(true);
        try {
          // Create an array of promises for each country ID
          const countryPromises = selectedLanguage.countries.map(countryId => 
            axios.get(`/api/countries/${countryId}`) // Fetch by specific country ID
          );
          
          // Wait for all promises to resolve
          const responses = await Promise.all(countryPromises);
          
          // Extract country data from responses
          const countries = responses
            .filter(response => response.data && response.data.success)
            .map(response => response.data.country as CountryDetails); // Cast to CountryDetails
          
          setLanguageCountries(countries);
        } catch (error) {
          console.error('Error fetching language countries:', error);
        } finally {
          setLoadingCountries(false);
        }
      }
    };

    fetchLanguageCountries();
  }, [selectedLanguage]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (languages.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4c-1.742 0-3.223-.835-3.772-2M12 12V7m0 10v-2.5" /> {/* Simple language icon placeholder */}
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No languages found</h3>
        <p className="mt-1 text-sm text-gray-500">There are no languages associated with this country yet.</p>
      </div>
    );
  }

  const openModal = (language: Language) => {
    setSelectedLanguage(language);
    setLanguageCountries([]);
  };

  return (
    <div>
      <div className="space-y-4">
        {languages.map((language) => (
          <div 
            key={language._id} 
            className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row">
              {/* Image column */} 
              <div 
                className="md:w-1/3 cursor-pointer bg-gray-100 flex items-center justify-center" // Added background and centering
                onClick={() => openModal(language)}
              >
                <div className="aspect-w-16 aspect-h-9 p-2"> {/* Added padding */} 
                  {language.imageUrl && (
                    <img 
                      src={getImageUrl(language.imageUrl)} 
                      alt={language.description || 'Language image'} 
                      className="w-full h-full object-contain" // Use contain for potentially non-uniform images
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
                <h3 className="font-semibold text-gray-800 mb-2">Language/Script Details</h3>
                <p className="text-gray-600 mb-3">{language.description || 'No description available'}</p>
                
                <div className="mt-3">
                  <button
                    onClick={() => openModal(language)}
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

      {/* Modal for displaying language details */}
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
                  alt={`Language image for ${selectedLanguage.description}`}
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
                <p className="text-gray-600">{selectedLanguage.description || 'No description available'}</p>
              </div>
              
              {/* Countries section */} 
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Countries where this language/script is primarily used</h4>
                {loadingCountries ? (
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

export default LanguageGallery; 