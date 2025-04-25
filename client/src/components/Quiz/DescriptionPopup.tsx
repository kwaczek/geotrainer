import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DescriptionPopupProps {
  isVisible: boolean;
  description: string;
  googleMapsUrl?: string;
  onClose: () => void;
}

const DescriptionPopup: React.FC<DescriptionPopupProps> = ({
  isVisible,
  description,
  googleMapsUrl,
  onClose
}) => {
  // Parse description to separate mnemonic from regular description
  const { regularDescription, mnemonic } = useMemo(() => {
    // Check if description contains "mnemonic:" marker (case-insensitive)
    const lowerCaseDesc = description.toLowerCase();
    const mnemonicIndex = lowerCaseDesc.indexOf("mnemonic:");

    if (mnemonicIndex !== -1) {
      // Find the actual position of the colon
      const colonIndex = description.indexOf(":", mnemonicIndex);

      if (colonIndex !== -1) {
        // Split the description into regular part and mnemonic part
        return {
          regularDescription: description.substring(0, mnemonicIndex).trim(),
          mnemonic: description.substring(colonIndex + 1).trim() // Skip the colon
        };
      }
    }

    // If no mnemonic marker found, return the full description as regular
    return {
      regularDescription: description,
      mnemonic: null
    };
  }, [description]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="space-y-3">
          {/* Mnemonic Section - Only show if mnemonic exists */}
          {mnemonic && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="w-full bg-purple-50 rounded-lg shadow-md p-3 border border-purple-200"
            >
              <div className="flex items-start">
                {/* Brain/Memory Icon */}
                <div className="flex-shrink-0 mr-2">
                  <div className="bg-purple-500 rounded-full p-1.5 shadow-md">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-grow pr-8">
                  {/* Title */}
                  <div className="mb-0.5">
                    <h3 className="text-xs font-bold text-purple-600">MNEMONIC</h3>
                  </div>

                  {/* Mnemonic Text */}
                  <p className="text-xs leading-relaxed text-gray-700">{mnemonic}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Regular Description Section - Only show if there's content */}
          {regularDescription && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 400, delay: mnemonic ? 0.1 : 0 }}
              className="w-full bg-blue-50 rounded-lg shadow-md p-3 border border-blue-200"
            >
              <div className="flex items-start">
                {/* Globe Icon */}
                <div className="flex-shrink-0 mr-2">
                  <div className="bg-blue-500 rounded-full p-1.5 shadow-md">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-grow pr-8">
                  {/* Title */}
                  <div className="mb-0.5">
                    <h3 className="text-xs font-bold text-blue-600">Did you know?</h3>
                  </div>

                  {/* Description Text */}
                  <p className="text-xs leading-relaxed text-gray-700">{regularDescription}</p>

                  {/* Google Maps Link */}
                  {googleMapsUrl && (
                    <div className="mt-1">
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 text-xs flex items-center font-medium"
                      >
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        View on Map
                      </a>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

export default DescriptionPopup;