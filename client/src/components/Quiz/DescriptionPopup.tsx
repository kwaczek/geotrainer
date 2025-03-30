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
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
          className="fixed top-1/4 right-4 z-50 max-w-xs"
        >
          <div className="bg-white rounded-lg shadow-xl p-4 relative border-2 border-blue-200">
            {/* Globe Icon */}
            <div className="absolute -left-3 top-4 transform -translate-y-1/2">
              <div className="bg-blue-500 rounded-full p-2 shadow-lg border-2 border-white">
                <svg
                  className="w-6 h-6 text-white"
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

            {/* Title */}
            <div className="text-center mb-1 pl-5">
              <h3 className="text-sm font-bold text-blue-600">Did you know?</h3>
            </div>

            {/* Description Text */}
            <div className="text-gray-700">
              <p className="text-sm leading-relaxed">{description}</p>
            </div>

            {/* Google Maps Link */}
            {googleMapsUrl && (
              <div className="mt-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 text-xs flex items-center font-medium"
                >
                  <svg
                    className="w-4 h-4 mr-1"
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
                  View on Google Maps
                </a>
              </div>
            )}

            {/* Close Button */}
            <div className="mt-3 text-right">
              <button
                onClick={onClose}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DescriptionPopup; 