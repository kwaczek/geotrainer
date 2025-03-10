import React from 'react';

interface CountryMapProps {
  countryName: string;
}

// Default map container style
const mapContainerStyle = {
  width: '100%',
  height: '200px',
  borderRadius: '0.375rem',
};

const CountryMap: React.FC<CountryMapProps> = ({ countryName }) => {
  // Default center (can be adjusted based on the country)
  const [center, setCenter] = React.useState({ lat: 0, lng: 0 });
  const [zoom, setZoom] = React.useState(3);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Geocode the country name to get coordinates
    const geocodeCountry = async () => {
      try {
        // Use OpenStreetMap's Nominatim service for geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(countryName)}&countrycodes=${encodeURIComponent(countryName)}&addressdetails=1&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          setCenter({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          });
          
          // Adjust zoom based on country size (if available in response)
          // Smaller countries get higher zoom values
          if (data[0].boundingbox) {
            // Calculate approximate country size
            const bbox = data[0].boundingbox;
            const latDiff = Math.abs(parseFloat(bbox[1]) - parseFloat(bbox[0]));
            const lonDiff = Math.abs(parseFloat(bbox[3]) - parseFloat(bbox[2]));
            
            // Adjust zoom based on country size
            // Smaller countries get higher zoom values
            if (latDiff < 5 && lonDiff < 5) {
              setZoom(7); // Very small country
            } else if (latDiff < 10 && lonDiff < 10) {
              setZoom(6); // Small country
            } else if (latDiff < 20 && lonDiff < 20) {
              setZoom(5); // Medium country
            } else {
              setZoom(4); // Large country
            }
          } else {
            setZoom(5); // Default zoom if no bounding box
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error geocoding country:', error);
        setIsLoading(false);
      }
    };

    if (countryName) {
      geocodeCountry();
    }
  }, [countryName]);

  if (isLoading) {
    return (
      <div className="bg-gray-100 animate-pulse rounded-md" style={mapContainerStyle}>
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  // Create a simple OpenStreetMap URL that doesn't require an API key
  // Adjust the bounding box to be smaller for a closer zoom
  // For smaller countries, use a tighter bounding box
  const zoomFactor = 2; // Smaller number = closer zoom
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng-zoomFactor},${center.lat-zoomFactor},${center.lng+zoomFactor},${center.lat+zoomFactor}&layer=mapnik&marker=${center.lat},${center.lng}`;

  return (
    <div className="map-container rounded-md overflow-hidden shadow-sm">
      <div style={mapContainerStyle} className="relative overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          title={`Map of ${countryName}`}
          style={{ border: 0 }}
          onError={(e) => {
            // This won't actually trigger for iframes, but we'll keep the structure
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const overlay = document.createElement('div');
              overlay.className = 'absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80';
              overlay.innerHTML = '<p class="text-gray-600">Map unavailable</p>';
              parent.appendChild(overlay);
            }
          }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1 text-center">
        Map of {countryName}
      </div>
    </div>
  );
};

export default CountryMap;
