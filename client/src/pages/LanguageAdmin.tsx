import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../config/apiConfig';

interface Country {
    _id: string;
    name: string;
    code: string;
}

interface Language { // Changed interface name
    _id: string;
    imageUrl: string;
    description: string;
    countries: Country[];
    createdAt: string;
}

const LanguageAdmin: React.FC = () => { // Changed component name
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]); // Changed state name
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchCountries();
        fetchLanguages(); // Changed function call
    }, []);

    const fetchCountries = async () => {
        try {
            // Assuming the same endpoint works for countries needed here
            const response = await axios.get('/api/languages/countries'); // Changed API endpoint (assuming reuse)
            setCountries(response.data);
        } catch (error) {
            console.error('Error fetching countries:', error);
        }
    };

    const fetchLanguages = async () => { // Changed function name
        try {
            const response = await axios.get('/api/languages'); // Changed API endpoint
            setLanguages(response.data); // Changed state setter
        } catch (error) {
            console.error('Error fetching languages:', error); // Changed error message
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

    const handleDelete = async (languageId: string) => { // Changed parameter name
        if (!window.confirm('Are you sure you want to delete this language entry? This action cannot be undone.')) {
            return;
        }

        setDeleting(languageId);
        try {
            // Get API key from localStorage or environment variable
            const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
            if (!apiKey) {
                throw new Error('API key not found. Please log in again.');
            }

            await axios.delete(`/api/languages/${languageId}`, { // Changed API endpoint
                headers: {
                    'X-API-Key': apiKey
                }
            });
            setLanguages(prev => prev.filter(lang => lang._id !== languageId)); // Changed state setter and variable
        } catch (error) {
            console.error('Error deleting language:', error); // Changed error message
            alert('Error deleting language'); // Changed alert message
        } finally {
            setDeleting(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile || selectedCountries.length === 0 || !description) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('description', description);
        formData.append('countries', JSON.stringify(selectedCountries));

        try {
            // Get API key from localStorage or environment variable
            const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
            if (!apiKey) {
                throw new Error('API key not found. Please log in again.');
            }

            await axios.post('/api/languages/upload', formData, { // Changed API endpoint
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-API-Key': apiKey
                },
            });
            
            // Reset form
            setSelectedFile(null);
            setDescription('');
            setSelectedCountries([]);
            if (event.target instanceof HTMLFormElement) {
                event.target.reset();
            }
            
            // Refresh languages list
            fetchLanguages(); // Changed function call
        } catch (error) {
            console.error('Error uploading language:', error); // Changed error message
            alert('Error uploading language'); // Changed alert message
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Language Admin</h1> {/* Changed title */} 
            
            {/* Upload Form */} 
            <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-white shadow">
                <div className="mb-4">
                    <label className="block mb-2">
                        Image (e.g., Screenshot of text): {/* Changed label */} 
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
                        Description (e.g., "Official Language"): {/* Changed label */} 
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
                    {loading ? 'Uploading...' : 'Upload Language Entry'} {/* Changed button text */} 
                </button>
            </form>

            {/* Existing Languages */} 
            <div>
                <h2 className="text-xl font-bold mb-4">Uploaded Language Entries</h2> {/* Changed title */} 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {languages.map(language => (
                        <div key={language._id} className="border rounded-lg p-4 bg-white shadow relative">
                            <img
                                src={getImageUrl(language.imageUrl)}
                                alt="Language Sample"
                                className="w-full h-48 object-cover rounded mb-2"
                            />
                            <p className="text-sm text-gray-600 mb-2">{language.description}</p>
                            <div className="text-xs text-gray-500">
                                Countries: {language.countries.map(c => c.name).join(', ')}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                Added: {new Date(language.createdAt).toLocaleDateString()}
                            </div>
                            <div className="absolute top-2 right-2">
                                <button
                                    onClick={() => handleDelete(language._id)}
                                    disabled={deleting === language._id}
                                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 disabled:bg-red-300"
                                >
                                    {deleting === language._id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LanguageAdmin; // Changed export name 