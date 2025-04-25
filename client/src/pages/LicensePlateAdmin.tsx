import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../config/apiConfig';

interface Country {
    _id: string;
    name: string;
    code: string;
}

interface LicensePlate {
    _id: string;
    imageUrl: string;
    description: string;
    countries: Country[];
    createdAt: string;
}

const LicensePlateAdmin: React.FC = () => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [licensePlates, setLicensePlates] = useState<LicensePlate[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchCountries();
        fetchLicensePlates();
    }, []);

    const fetchCountries = async () => {
        try {
            const response = await axios.get('/api/licenseplates/countries');
            setCountries(response.data);
        } catch (error) {
            console.error('Error fetching countries:', error);
        }
    };

    const fetchLicensePlates = async () => {
        try {
            const response = await axios.get('/api/licenseplates');
            setLicensePlates(response.data);
        } catch (error) {
            console.error('Error fetching license plates:', error);
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

    const loadLicensePlateForEdit = (licensePlate: LicensePlate) => {
        setEditMode(true);
        setEditId(licensePlate._id);
        setDescription(licensePlate.description || '');

        const countryIds = licensePlate.countries.map(country => country._id);
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

    const handleDelete = async (licensePlateId: string) => {
        if (!window.confirm('Are you sure you want to delete this license plate? This action cannot be undone.')) {
            return;
        }

        setDeleting(licensePlateId);
        try {
            // Get API key from localStorage or environment variable
            const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
            if (!apiKey) {
                throw new Error('API key not found. Please log in again.');
            }

            await axios.delete(`/api/licenseplates/${licensePlateId}`, {
                headers: {
                    'X-API-Key': apiKey
                }
            });
            setLicensePlates(prev => prev.filter(lp => lp._id !== licensePlateId));
        } catch (error) {
            console.error('Error deleting license plate:', error);
            alert('Error deleting license plate');
        } finally {
            setDeleting(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (editMode && !editId) {
            setError('No license plate ID found for editing');
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
                await axios.put(`/api/licenseplates/${editId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-API-Key': apiKey
                    },
                });
                setSuccess('License plate updated successfully!');
            } else {
                await axios.post('/api/licenseplates/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-API-Key': apiKey
                    },
                });
                setSuccess('License plate uploaded successfully!');
            }

            resetForm();
            fetchLicensePlates();
        } catch (error) {
            console.error('Error processing license plate:', error);
            setError('Error processing license plate. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">License Plate Admin</h1>

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
                <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit License Plate' : 'Add New License Plate'}</h2>

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
                        {loading ? 'Processing...' : editMode ? 'Update License Plate' : 'Upload License Plate'}
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

            {/* Existing License Plates */}
            <div>
                <h2 className="text-xl font-bold mb-4">Uploaded License Plates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {licensePlates.map(licensePlate => (
                        <div key={licensePlate._id} className="border rounded-lg p-4 bg-white shadow relative">
                            <img
                                src={getImageUrl(licensePlate.imageUrl)}
                                alt="License Plate"
                                className="w-full h-48 object-cover rounded mb-2"
                            />
                            <p className="text-sm text-gray-600 mb-2">{licensePlate.description}</p>
                            <div className="text-xs text-gray-500">
                                Countries: {licensePlate.countries.map(c => c.name).join(', ')}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                Added: {new Date(licensePlate.createdAt).toLocaleDateString()}
                            </div>
                            <div className="absolute top-2 right-2 flex space-x-2">
                                <button
                                    onClick={() => loadLicensePlateForEdit(licensePlate)}
                                    className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(licensePlate._id)}
                                    disabled={deleting === licensePlate._id}
                                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 disabled:bg-red-300"
                                >
                                    {deleting === licensePlate._id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LicensePlateAdmin;