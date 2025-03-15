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
    googleMapsUrl: string;
    countries: Country[];
    createdAt: string;
}

const LicensePlateAdmin: React.FC = () => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [googleMapsUrl, setGoogleMapsUrl] = useState('');
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [licensePlates, setLicensePlates] = useState<LicensePlate[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

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

    const handleDelete = async (licensePlateId: string) => {
        if (!window.confirm('Are you sure you want to delete this license plate? This action cannot be undone.')) {
            return;
        }

        setDeleting(licensePlateId);
        try {
            await axios.delete(`/api/licenseplates/${licensePlateId}`);
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
            await axios.post('/api/licenseplates/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            // Reset form
            setSelectedFile(null);
            setDescription('');
            setGoogleMapsUrl('');
            setSelectedCountries([]);
            if (event.target instanceof HTMLFormElement) {
                event.target.reset();
            }
            
            // Refresh license plates list
            fetchLicensePlates();
        } catch (error) {
            console.error('Error uploading license plate:', error);
            alert('Error uploading license plate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">License Plate Admin</h1>
            
            {/* Upload Form */}
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
                    {loading ? 'Uploading...' : 'Upload License Plate'}
                </button>
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
                            <div className="text-xs text-gray-500 mt-1">
                                <a 
                                    href={licensePlate.googleMapsUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    View on Google Maps
                                </a>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                Added: {new Date(licensePlate.createdAt).toLocaleDateString()}
                            </div>
                            <div className="absolute top-2 right-2">
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