import React, { useState, useEffect, useRef } from 'react';

interface TooltipProps {
  text: string;
  children?: React.ReactNode; // Optional children if you want to wrap other elements
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null); // Ref for the main tooltip container

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup listener on component unmount or when tooltip closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleTooltip = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the outside click listener immediately
    setIsOpen(!isOpen);
  };

  return (
    <div ref={tooltipRef} className="relative flex items-center ml-1.5"> {/* Use ref here */}
      {/* Trigger Element */} 
      <span 
        className="cursor-pointer text-gray-500 hover:text-gray-700" 
        onClick={toggleTooltip} // Use onClick to toggle
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="More info"
      >
        {children ? (
          children // Render children if provided
        ) : (
          // Default: Render a question mark icon
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </span>
      
      {/* Tooltip Box - Conditionally Rendered/Styled */}
      <div 
        className={`
          absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 /* Position above */
          w-max max-w-[200px] sm:max-w-xs px-3 py-2 
          bg-gradient-to-br from-gray-800 to-gray-900 text-white text-xs rounded-md shadow-lg 
          transition-all duration-200 ease-in-out z-20 
          whitespace-normal text-center 
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        role="tooltip"
      >
        {text}
        {/* Arrow pointing down */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-full h-0 w-0 
                        border-x-4 border-x-transparent /* Make horizontal sides transparent */
                        border-t-4 border-t-gray-800">   /* Top border creates the arrow */
        </div>
      </div>
    </div>
  );
};

export default Tooltip; 