import React from 'react';

interface CountryInfo {
  name: string;
  capital?: string;
  continent?: string;
  flagUrl?: string;
}

interface CountryInfoPopupProps {
  country: CountryInfo;
  isVisible: boolean;
  onClose: () => void;
}

const CountryInfoPopup: React.FC<CountryInfoPopupProps> = ({ country, isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{country.name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {country.flagUrl && (
            <div className="flex-shrink-0">
              <img 
                src={country.flagUrl} 
                alt={`Flag of ${country.name}`} 
                className="w-full md:w-48 h-auto object-cover border border-gray-200 rounded-md shadow-sm"
              />
              <div className="text-xs text-gray-500 mt-1 text-center">Flag of {country.name}</div>
            </div>
          )}
          
          <div className="flex-grow">
            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <div className="text-blue-800 font-medium mb-2">Correct Answer!</div>
              <div className="text-lg font-bold text-blue-900">{country.name}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
              {country.capital && (
                <>
                  <div className="text-gray-600 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Capital:
                  </div>
                  <div className="font-medium">{country.capital}</div>
                </>
              )}
              
              {country.continent && (
                <>
                  <div className="text-gray-600 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Continent:
                  </div>
                  <div className="font-medium">{country.continent}</div>
                </>
              )}
              
              <div className="text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Country:
              </div>
              <div className="font-medium text-green-600">{country.name}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm flex items-center mx-auto"
          >
            <span>Continue Quiz</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CountryInfoPopup;
