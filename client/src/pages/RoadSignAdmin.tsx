import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface Country {
  _id: string;
  name: string;
  code: string;
}

interface RoadSign {
  _id: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: Country[];
  createdAt: string;
  isPedestrian: boolean;
}

const RoadSignAdmin: React.FC = () => {
  useDocumentTitle('Road Sign Admin');
  const navigate = useNavigate();
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [roadSigns, setRoadSigns] = useState<RoadSign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Form state
  const [image, setImage] = useState<File | null>(null);
  const [description, setDescription] = useState<string>('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [isPedestrian, setIsPedestrian] = useState<boolean>(false);
  
  useEffect(() => {
    fetchCountries();
    fetchRoadSigns();
  }, []);
  
  const fetchCountries = async () => {
    try {
      const response = await axios.get('/api/bollards/countries');
      setCountries(response.data);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setError('Failed to fetch countries. Please try again.');
    }
  };
  
  const fetchRoadSigns = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/roadsigns');
      if (response.data && response.data.success && Array.isArray(response.data.roadSigns)) {
        setRoadSigns(response.data.roadSigns);
      } else {
        console.error('Invalid road signs response format:', response.data);
        setError('Received invalid data format from server.');
        setRoadSigns([]);
      }
    } catch (error) {
      console.error('Error fetching road signs:', error);
      setError('Failed to fetch road signs. Please try again.');
      setRoadSigns([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };
  
  const handleCountryToggle = (countryId: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(countryId)) {
        return prev.filter(id => id !== countryId);
      }
      return [...prev, countryId];
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate form
      if (!image) {
        throw new Error('Please select an image');
      }
      
      if (selectedCountries.length === 0) {
        throw new Error('Please select at least one country');
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('image', image);
      formData.append('description', description);
      formData.append('googleMapsUrl', googleMapsUrl);
      formData.append('countries', JSON.stringify(selectedCountries));
      formData.append('isPedestrian', String(isPedestrian));
      
      // Get API key from localStorage
      const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
      
      if (!apiKey) {
        throw new Error('API key not found. Please log in again.');
      }
      
      // Submit the form
      const response = await axios.post('/api/roadsigns/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-API-Key': apiKey
        }
      });
      
      if (response.data.success) {
        setSuccess('Road sign uploaded successfully!');
        
        // Reset form
        setImage(null);
        setDescription('');
        setGoogleMapsUrl('');
        setSelectedCountries([]);
        setIsPedestrian(false);
        
        // Clear file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        // Refresh road signs list
        fetchRoadSigns();
      } else {
        throw new Error(response.data.message || 'Failed to upload road sign');
      }
    } catch (error: any) {
      console.error('Error uploading road sign:', error);
      setError(error.message || 'Failed to upload road sign. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle road sign deletion
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this road sign?')) {
      return;
    }
    
    setDeleting(id);
    
    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
      
      if (!apiKey) {
        throw new Error('API key not found. Please log in again.');
      }
      
      await axios.delete(`/api/roadsigns/${id}`, {
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      setSuccess('Road sign deleted successfully!');
      
      // Remove the deleted road sign from state
      setRoadSigns(prevRoadSigns => prevRoadSigns.filter(sign => sign._id !== id));
    } catch (error: any) {
      console.error('Error deleting road sign:', error);
      setError(error.message || 'Failed to delete road sign. Please try again.');
    } finally {
      setDeleting(null);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Road Sign Admin</h1>
      
      {/* Error and success messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {/* Upload form */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-white shadow">
        <div className="mb-4">
          <label className="block mb-2">
            Image:
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full"
              required
            />
          </label>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">
            Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border rounded p-2"
              rows={3}
            />
          </label>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">
            Google Maps URL:
            <input
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              className="mt-1 block w-full border rounded p-2"
              placeholder="https://www.google.com/maps/@...."
            />
          </label>
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2">Type:</h3>
          <div className="p-3 border rounded bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isPedestrian}
                  onChange={(e) => setIsPedestrian(e.target.checked)}
                  className="form-checkbox"
                />
                <span>Pedestrian Sign</span>
              </label>
              {/* Additional checkboxes can be added here */}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">Countries:</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
            {countries.map(country => (
              <label key={country._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCountries.includes(country._id)}
                  onChange={() => handleCountryToggle(country._id)}
                  className="form-checkbox"
                />
                <span>{country.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Uploading...' : 'Upload Road Sign'}
        </button>
      </form>
      
      {/* Road signs list */}
      <div>
        <h2 className="text-xl font-bold mb-4">Uploaded Road Signs ({roadSigns.length})</h2>
        
        {loading && <p>Loading...</p>}
        
        {!loading && roadSigns.length === 0 && (
          <p>No road signs found. Upload some!</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadSigns.map(sign => (
            <div key={sign._id} className="border rounded-lg p-4 bg-white shadow relative">
              <img
                src={sign.imageUrl}
                alt={sign.description}
                className="w-full h-48 object-cover rounded mb-2"
              />
              
              <p className="text-sm text-gray-600 mb-2">{sign.description}</p>
              
              <div className="text-xs text-gray-500">
                Countries: {Array.isArray(sign.countries) ? sign.countries.map(c => c.name).join(', ') : 'Unknown country'}
              </div>
              
              {sign.isPedestrian && (
                <div className="text-xs text-blue-500 font-semibold mt-1">
                  Pedestrian Sign
                </div>
              )}
              
              {sign.googleMapsUrl && (
                <div className="text-xs text-gray-500 mt-1">
                  <a
                    href={sign.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    View on Google Maps
                  </a>
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-1">
                Added: {new Date(sign.createdAt).toLocaleDateString()}
              </div>
              
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => handleDelete(sign._id)}
                  disabled={deleting === sign._id}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 disabled:bg-red-300"
                >
                  {deleting === sign._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadSignAdmin; 