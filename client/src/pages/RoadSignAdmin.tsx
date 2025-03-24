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
}

const RoadSignAdmin: React.FC = () => {
  useDocumentTitle('Road Sign Admin');
  const navigate = useNavigate();
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [roadSigns, setRoadSigns] = useState<RoadSign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Form state
  const [image, setImage] = useState<File | null>(null);
  const [description, setDescription] = useState<string>('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  
  // Fetch countries and road signs on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [countriesRes, roadSignsRes] = await Promise.all([
          axios.get('/api/countries'),
          axios.get('/api/roadsigns')
        ]);
        
        setCountries(countriesRes.data);
        setRoadSigns(roadSignsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
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
      
      if (!description) {
        throw new Error('Please enter a description');
      }
      
      if (!googleMapsUrl) {
        throw new Error('Please enter a Google Maps URL');
      }
      
      if (selectedCountries.length === 0) {
        throw new Error('Please select at least one country');
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('image', image);
      formData.append('description', description);
      formData.append('googleMapsUrl', googleMapsUrl);
      
      // Add selected countries
      selectedCountries.forEach(countryId => {
        formData.append('countries[]', countryId);
      });
      
      // Get API key from localStorage
      const apiKey = localStorage.getItem('apiKey');
      
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
        
        // Clear file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        // Refresh road signs list
        const roadSignsRes = await axios.get('/api/roadsigns');
        setRoadSigns(roadSignsRes.data);
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
    
    setLoading(true);
    
    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem('apiKey');
      
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
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Road Sign Admin</h1>
      
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
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New Road Sign</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Image</label>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Google Maps URL</label>
            <input
              type="text"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Countries</label>
            <select
              multiple
              value={selectedCountries}
              onChange={(e) => setSelectedCountries(Array.from(e.target.selectedOptions, option => option.value))}
              className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3"
              size={5}
            >
              {countries.map(country => (
                <option key={country._id} value={country._id}>
                  {country.name}
                </option>
              ))}
            </select>
            <p className="text-gray-500 text-sm mt-1">Hold Ctrl/Cmd to select multiple countries</p>
          </div>
          
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>
      
      {/* Road signs list */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Existing Road Signs ({roadSigns.length})</h2>
        
        {loading && <p>Loading...</p>}
        
        {!loading && roadSigns.length === 0 && (
          <p>No road signs found. Upload some!</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roadSigns.map(sign => (
            <div key={sign._id} className="border rounded-lg overflow-hidden">
              <img
                src={sign.imageUrl}
                alt={sign.description}
                className="w-full h-48 object-cover"
              />
              
              <div className="p-4">
                <p className="font-semibold mb-2">
                  {sign.countries.map(country => country.name).join(', ')}
                </p>
                
                <p className="text-gray-700 mb-2">{sign.description}</p>
                
                <div className="flex justify-between items-center">
                  <a
                    href={sign.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View on Maps
                  </a>
                  
                  <button
                    onClick={() => handleDelete(sign._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadSignAdmin; 