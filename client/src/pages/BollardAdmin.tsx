import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../config/apiConfig';

interface Country {
    _id: string;
    name: string;
    code: string;
}

interface Bollard {
    _id: string;
    imageUrl: string;
    description: string;
    googleMapsUrl: string;
    countries: Country[];
    createdAt: string;
}

const BollardAdmin: React.FC = () => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [googleMapsUrl, setGoogleMapsUrl] = useState('');
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [bollards, setBollards] = useState<Bollard[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    useEffect(() => {
        fetchCountries();
        fetchBollards();
    }, []);

    const fetchCountries = async () => {
        try {
            const response = await axios.get('/api/bollards/countries');
            setCountries(response.data);
        } catch (error) {
            console.error('Error fetching countries:', error);
            setError('Error fetching countries. Please try again.');
        }
    };

    const fetchBollards = async () => {
        try {
            const response = await axios.get('/api/bollards');
            setBollards(response.data);
        } catch (error) {
            console.error('Error fetching bollards:', error);
            setError('Error fetching bollards. Please try again.');
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

    const loadBollardForEdit = (bollard: Bollard) => {
        setEditMode(true);
        setEditId(bollard._id);
        setDescription(bollard.description || '');
        setGoogleMapsUrl(bollard.googleMapsUrl || '');
        
        const countryIds = bollard.countries.map(country => country._id);
        setSelectedCountries(countryIds);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const resetForm = () => {
        setEditMode(false);
        setEditId(null);
        setSelectedFile(null);
        setDescription('');
        setGoogleMapsUrl('');
        setSelectedCountries([]);
        
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleDelete = async (bollardId: string) => {
        if (!window.confirm('Are you sure you want to delete this bollard? This action cannot be undone.')) {
            return;
        }

        setDeleting(bollardId);
        try {
            const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
            if (!apiKey) {
                throw new Error('API key not found. Please log in again.');
            }

            await axios.delete(`/api/bollards/${bollardId}`, {
                headers: {
                    'X-API-Key': apiKey
                }
            });
            setBollards(prev => prev.filter(b => b._id !== bollardId));
            setSuccess('Bollard deleted successfully!');
        } catch (error) {
            console.error('Error deleting bollard:', error);
            setError('Error deleting bollard. Please try again.');
        } finally {
            setDeleting(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (editMode && !editId) {
            setError('No bollard ID found for editing');
            return;
        }
        
        if (!editMode && !selectedFile) {
            setError('Please select an image');
            return;
        }
        
        if (selectedCountries.length === 0) {
            setError('Please select at least one country');
            return;
        }
        
        if (!description) {
            setError('Please provide a description');
            return;
        }
        
        if (!googleMapsUrl) {
            setError('Please provide a Google Maps URL');
            return;
        }
        
        setLoading(true);
        setError('');
        setSuccess('');
        
        const formData = new FormData();
        if (selectedFile) {
            formData.append('image', selectedFile);
        }
        formData.append('description', description);
        formData.append('googleMapsUrl', googleMapsUrl);
        formData.append('countries', JSON.stringify(selectedCountries));

        try {
            const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
            if (!apiKey) {
                throw new Error('API key not found. Please log in again.');
            }

            if (editMode) {
                await axios.put(`/api/bollards/${editId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-API-Key': apiKey
                    },
                });
                setSuccess('Bollard updated successfully!');
            } else {
                await axios.post('/api/bollards/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-API-Key': apiKey
                    },
                });
                setSuccess('Bollard uploaded successfully!');
            }
            
            resetForm();
            
            fetchBollards();
        } catch (error) {
            console.error('Error processing bollard:', error);
            setError('Error processing bollard. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Bollard Admin</h1>
            
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
            
            <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-white shadow">
                <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit Bollard' : 'Add New Bollard'}</h2>
                
                {!editMode && (
                    <div className="mb-4">
                        <label className="block mb-2">
                            Image:
                            <input
                                id="file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="mt-1 block w-full"
                                required={!editMode}
                            />
                        </label>
                    </div>
                )}
                
                {editMode && (
                    <div className="mb-4">
                        <label className="block mb-2">
                            Update Image (optional):
                            <input
                                id="file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="mt-1 block w-full"
                            />
                        </label>
                    </div>
                )}

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

                <div className="flex space-x-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        {loading ? 'Processing...' : editMode ? 'Update Bollard' : 'Upload Bollard'}
                    </button>
                    
                    {editMode && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </form>

            <div>
                <h2 className="text-xl font-bold mb-4">Uploaded Bollards ({bollards.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bollards.map(bollard => (
                        <div key={bollard._id} className="border rounded-lg p-4 bg-white shadow relative">
                            <img
                                src={getImageUrl(bollard.imageUrl)}
                                alt="Bollard"
                                className="w-full h-48 object-cover rounded mb-2"
                            />
                            <p className="text-sm text-gray-600 mb-2">{bollard.description}</p>
                            <div className="text-xs text-gray-500">
                                Countries: {bollard.countries.map(c => c.name).join(', ')}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                <a 
                                    href={bollard.googleMapsUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    View on Google Maps
                                </a>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                Added: {new Date(bollard.createdAt).toLocaleDateString()}
                            </div>
                            <div className="absolute top-2 right-2 flex space-x-2">
                                <button
                                    onClick={() => loadBollardForEdit(bollard)}
                                    className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(bollard._id)}
                                    disabled={deleting === bollard._id}
                                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 disabled:bg-red-300"
                                >
                                    {deleting === bollard._id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BollardAdmin;
