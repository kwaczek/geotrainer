import React from 'react';
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
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
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
              <p className="text-xs leading-relaxed text-gray-700">{description}</p>

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
    </AnimatePresence>
  );
};

export default DescriptionPopup;