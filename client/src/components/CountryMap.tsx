import React, { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface CountryMapProps {
  countryName: string;
  countryCode?: string;
}

// Fix Leaflet default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png'
});

const CountryMap: React.FC<CountryMapProps> = ({ countryName, countryCode }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCountryBounds = async () => {
      try {
        setLoading(true);
        setError(false);

        // Use OpenStreetMap Nominatim API to get country boundaries
        // We'll try both code and name to maximize chances of finding the country
        let queryParam = '';
        
        if (countryCode) {
          queryParam = `country=${encodeURIComponent(countryCode.toUpperCase())}`;
        } else if (countryName) {
          queryParam = `q=${encodeURIComponent(countryName)}`;
        }
        
        // If we have both, prioritize code but prepare to fall back to name
        if (countryCode && countryName) {
          queryParam = `country=${encodeURIComponent(countryCode.toUpperCase())}`;
        }
        
        // Nominatim requires a User-Agent header
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${queryParam}&format=json&polygon_geojson=1&limit=1`,
          {
            headers: {
              'User-Agent': 'GeoPrep/1.0 (https://geoprep.fun; miro.boto83@gmail.com)',
              'Accept-Language': 'en'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch country data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.length === 0) {
          // Try again with the country name if code didn't work
          if (countryCode && countryName) {
            const nameResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(countryName)}&format=json&polygon_geojson=1&limit=1`,
              {
                headers: {
                  'User-Agent': 'GeoPrep/1.0 (https://geoprep.fun; miro.boto83@gmail.com)',
                  'Accept-Language': 'en'
                }
              }
            );
            
            if (nameResponse.ok) {
              const nameData = await nameResponse.json();
              if (nameData.length > 0) {
                data.push(...nameData);
              }
            }
          }
          
          if (data.length === 0) {
            throw new Error(`Country not found: ${countryName || countryCode}`);
          }
        }

        const { boundingbox, lat, lon } = data[0];
        const [southLat, northLat, westLng, eastLng] = boundingbox.map(Number);

        // Initialize the map if it hasn't been initialized yet
        if (!mapRef.current && mapContainerRef.current) {
          mapRef.current = L.map(mapContainerRef.current, {
            attributionControl: false, // Hide attribution for cleaner look
            zoomControl: true,
            dragging: true,
          });
          
          // Add OpenStreetMap tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(mapRef.current);
        }

        // Set view to the country's bounds
        if (mapRef.current) {
          const bounds = L.latLngBounds(
            [southLat, westLng],
            [northLat, eastLng]
          );
          
          // Fit the map to the country bounds with some padding
          mapRef.current.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 7 // Limit max zoom to prevent too much detail
          });
          
          // Add country shape if GeoJSON is available
          if (data[0].geojson) {
            L.geoJSON(data[0].geojson, {
              style: {
                color: '#3b82f6',
                weight: 2,
                opacity: 0.7,
                fillColor: '#3b82f6',
                fillOpacity: 0.2
              }
            }).addTo(mapRef.current);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading map:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchCountryBounds();

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [countryName, countryCode]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-full bg-gray-100 p-4 text-center">
        <svg className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-gray-600 mb-1">Unable to load map for {countryName}</p>
        <p className="text-sm text-gray-500">{countryCode && `(Code: ${countryCode.toUpperCase()})`}</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef} 
      className="h-full w-full rounded-lg overflow-hidden bg-gray-50"
      style={{ minHeight: '300px' }}
    />
  );
};

export default CountryMap;
