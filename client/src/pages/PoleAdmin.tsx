import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../config/apiConfig';

interface Country {
    _id: string;
    name: string;
    code: string;
}

interface Pole {
    _id: string;
    imageUrl: string;
    description: string;
    googleMapsUrl: string;
    countries: Country[];
    createdAt: string;
}

const PoleAdmin: React.FC = () => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [googleMapsUrl, setGoogleMapsUrl] = useState('');
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [poles, setPoles] = useState<Pole[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchCountries();
        fetchPoles();
    }, []);

    const fetchCountries = async () => {
        try {
            // Use the same endpoint as BollardAdmin, assuming countries are shared
            const response = await axios.get('/api/bollards/countries'); // Corrected endpoint
            setCountries(response.data);
        } catch (error) {
            console.error('Error fetching countries:', error);
            // Consider adding user feedback here, e.g., set an error state
        }
    };

    const fetchPoles = async () => {
        try {
            const response = await axios.get('/api/poles');
            setPoles(response.data);
        } catch (error) {
            console.error('Error fetching poles:', error);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
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

    const handleDelete = async (poleId: string) => {
        if (!window.confirm('Are you sure you want to delete this pole? This action cannot be undone.')) {
            return;
        }

        setDeleting(poleId);
        try {
            const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
            if (!apiKey) {
                throw new Error('API key not found. Please log in again.');
            }

            await axios.delete(`/api/poles/${poleId}`, {
                headers: {
                    'X-API-Key': apiKey
                }
            });
            setPoles(prev => prev.filter(p => p._id !== poleId));
        } catch (error) {
            console.error('Error deleting pole:', error);
            alert('Error deleting pole');
        } finally {
            setDeleting(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile || selectedCountries.length === 0 || !description || !googleMapsUrl) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('description', description);
        formData.append('googleMapsUrl', googleMapsUrl);
        formData.append('countries', JSON.stringify(selectedCountries));

        try {
            const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
            if (!apiKey) {
                throw new Error('API key not found. Please log in again.');
            }

            await axios.post('/api/poles/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-API-Key': apiKey
                },
            });
            
            setSelectedFile(null);
            setDescription('');
            setGoogleMapsUrl('');
            setSelectedCountries([]);
            if (event.target instanceof HTMLFormElement) {
                event.target.reset();
            }
            
            fetchPoles();
        } catch (error) {
            console.error('Error uploading pole:', error);
            alert('Error uploading pole');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Pole Admin</h1>
            
            <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-white shadow">
                <div className="mb-4">
                    <label className="block mb-2">
                        Image:
                        <input
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
                            required
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
                            required
                        />
                    </label>
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
                    {loading ? 'Uploading...' : 'Upload Pole'}
                </button>
            </form>

            <div>
                <h2 className="text-xl font-bold mb-4">Uploaded Poles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {poles.map(pole => (
                        <div key={pole._id} className="border rounded-lg p-4 bg-white shadow relative">
                            <img
                                src={getImageUrl(pole.imageUrl)}
                                alt="Pole"
                                className="w-full h-48 object-cover rounded mb-2"
                            />
                            <p className="text-sm text-gray-600 mb-2">{pole.description}</p>
                            <div className="text-xs text-gray-500">
                                Countries: {pole.countries.map(c => c.name).join(', ')}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                <a 
                                    href={pole.googleMapsUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    View on Google Maps
                                </a>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                Added: {new Date(pole.createdAt).toLocaleDateString()}
                            </div>
                            <div className="absolute top-2 right-2">
                                <button
                                    onClick={() => handleDelete(pole._id)}
                                    disabled={deleting === pole._id}
                                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 disabled:bg-red-300"
                                >
                                    {deleting === pole._id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PoleAdmin; 