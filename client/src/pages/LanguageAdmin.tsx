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
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    const loadLanguageForEdit = (language: Language) => {
        setEditMode(true);
        setEditId(language._id);
        setDescription(language.description || '');

        const countryIds = language.countries.map(country => country._id);
        setSelectedCountries(countryIds);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditMode(false);
        setEditId(null);
        setSelectedFile(null);
        setDescription('');
        setSelectedCountries([]);
        setError('');
        setSuccess('');

        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
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

        if (editMode && !editId) {
            setError('No language ID found for editing');
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

        setLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        if (selectedFile) {
            formData.append('image', selectedFile);
        }
        formData.append('description', description);
        formData.append('countries', JSON.stringify(selectedCountries));

        try {
            // Get API key from localStorage or environment variable
            const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
            if (!apiKey) {
                throw new Error('API key not found. Please log in again.');
            }

            if (editMode) {
                await axios.put(`/api/languages/${editId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-API-Key': apiKey
                    },
                });
                setSuccess('Language updated successfully!');
            } else {
                await axios.post('/api/languages/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-API-Key': apiKey
                    },
                });
                setSuccess('Language uploaded successfully!');
            }

            resetForm();
            fetchLanguages();
        } catch (error) {
            console.error('Error processing language:', error);
            setError('Error processing language. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Language Admin</h1> {/* Changed title */}

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                    {success}
                </div>
            )}

            {/* Upload/Edit Form */}
            <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-white shadow">
                <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit Language Entry' : 'Add New Language Entry'}</h2>

                {!editMode && (
                    <div className="mb-4">
                        <label className="block mb-2">
                            Image (e.g., Screenshot of text): {/* Changed label */}
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

                <div className="flex space-x-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        {loading ? 'Processing...' : editMode ? 'Update Language Entry' : 'Upload Language Entry'}
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
                            <div className="absolute top-2 right-2 flex space-x-2">
                                <button
                                    onClick={() => loadLanguageForEdit(language)}
                                    className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                                >
                                    Edit
                                </button>
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