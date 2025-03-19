import React, { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface CountryMapProps {
  countryName: string;
}

// Fix Leaflet default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const CountryMap: React.FC<CountryMapProps> = ({ countryName }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCountryBounds = async () => {
      try {
        setLoading(true);
        setError(false);

        // Use Nominatim to geocode the country name
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(
            countryName
          )}&format=json&limit=1`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch country data');
        }

        const data = await response.json();

        if (data.length === 0) {
          throw new Error('Country not found');
        }

        const { boundingbox, lat, lon } = data[0];
        const [southLat, northLat, westLng, eastLng] = boundingbox.map(Number);

        // Initialize the map if it hasn't been initialized yet
        if (!mapRef.current && mapContainerRef.current) {
          mapRef.current = L.map(mapContainerRef.current);
          
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
          mapRef.current.fitBounds(bounds);
          
          // Add a marker at the country's center
          L.marker([parseFloat(lat), parseFloat(lon)]).addTo(mapRef.current);
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
  }, [countryName]);

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
        <p className="text-gray-600">Unable to load map for {countryName}</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef} 
      className="h-full w-full rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  );
};

export default CountryMap;
