import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Country {
    _id?: string;  // Use optional _id
    id?: string;   // Also allow id
    name: string;
    capital: string;
    continent: string;
    code: string;
    in_geoguessr: boolean;
}

const CONTINENTS = [
    'Africa', 
    'Asia', 
    'Europe', 
    'North America', 
    'South America', 
    'Oceania', 
    'Antarctica'
];

const CountryAdmin: React.FC = () => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    
    // Form states
    const [editingCountry, setEditingCountry] = useState<Country | null>(null);
    const [name, setName] = useState('');
    const [capital, setCapital] = useState('');
    const [continent, setContinent] = useState('');
    const [code, setCode] = useState('');
    const [inGeoguessr, setInGeoguessr] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/countries');
            setCountries(response.data.countries);
        } catch (error) {
            console.error('Error fetching countries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (country: Country) => {
        setEditingCountry(country);
        setName(country.name);
        setCapital(country.capital);
        setContinent(country.continent);
        setCode(country.code || '');
        setInGeoguessr(country.in_geoguessr);
        scrollToForm();
    };

    const handleDelete = async (countryId: string) => {
        if (!window.confirm('Are you sure you want to delete this country? This action cannot be undone and will fail if the country is used in bollards or license plates.')) {
            return;
        }

        setDeleting(countryId);
        try {
            // Get API key from localStorage or environment variable
            const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
            if (!apiKey) {
                throw new Error('API key not found. Please log in again.');
            }

            await axios.delete(`/api/countries/${countryId}`, {
                headers: {
                    'X-API-Key': apiKey
                }
            });
            setCountries(prev => prev.filter(c => {
                const currentId = c.id || c._id;
                return currentId !== countryId;
            }));
            setFormSuccess('Country deleted successfully');
            clearFormMessages();
        } catch (error: any) {
            console.error('Error deleting country:', error);
            setFormError(error.response?.data?.message || 'Error deleting country');
            clearFormMessages();
        } finally {
            setDeleting(null);
        }
    };

    const resetForm = () => {
        setEditingCountry(null);
        setName('');
        setCapital('');
        setContinent('');
        setCode('');
        setInGeoguessr(false);
        setFormError(null);
        setFormSuccess(null);
    };

    const scrollToForm = () => {
        document.getElementById('countryForm')?.scrollIntoView({ behavior: 'smooth' });
    };

    const clearFormMessages = () => {
        setTimeout(() => {
            setFormError(null);
            setFormSuccess(null);
        }, 3000);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (!name || !capital || !continent) {
            setFormError('Name, capital, and continent are required');
            clearFormMessages();
            return;
        }

        setLoading(true);
        setFormError(null);
        setFormSuccess(null);

        // Get API key from localStorage or environment variable
        const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
        if (!apiKey) {
            setFormError('API key not found. Please log in again.');
            clearFormMessages();
            setLoading(false);
            return;
        }

        const countryData = {
            name,
            capital,
            continent,
            code,
            in_geoguessr: inGeoguessr
        };

        try {
            if (editingCountry) {
                // Update existing country - use id or _id, whichever is available
                const countryId = editingCountry.id || editingCountry._id;
                if (!countryId) {
                    setFormError('Missing country ID');
                    clearFormMessages();
                    setLoading(false);
                    return;
                }
                
                const response = await axios.put(`/api/countries/${countryId}`, countryData, {
                    headers: {
                        'X-API-Key': apiKey
                    }
                });
                
                // Update the countries list, handling both id or _id
                setCountries(prev => 
                    prev.map(c => {
                        const currentId = c.id || c._id;
                        const updatedId = response.data.country.id || response.data.country._id;
                        return currentId === updatedId ? response.data.country : c;
                    })
                );
                setFormSuccess('Country updated successfully');
            } else {
                // Create new country
                const response = await axios.post('/api/countries', countryData, {
                    headers: {
                        'X-API-Key': apiKey
                    }
                });
                
                setCountries(prev => [...prev, response.data.country]);
                setFormSuccess('Country created successfully');
            }
            
            resetForm();
            clearFormMessages();
        } catch (error: any) {
            console.error('Error saving country:', error);
            setFormError(error.response?.data?.message || 'Error saving country');
            clearFormMessages();
        } finally {
            setLoading(false);
        }
    };

    const filteredCountries = countries.filter(country => 
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        country.capital.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.continent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Country Admin</h1>
            
            {/* Country Form */}
            <form id="countryForm" onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-white shadow">
                <h2 className="text-xl font-semibold mb-4">
                    {editingCountry ? 'Edit Country' : 'Add New Country'}
                </h2>
                
                {formError && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {formError}
                    </div>
                )}
                
                {formSuccess && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {formSuccess}
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2">
                            Country Name:
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full border rounded p-2"
                                required
                            />
                        </label>
                    </div>
                    
                    <div>
                        <label className="block mb-2">
                            Capital:
                            <input
                                type="text"
                                value={capital}
                                onChange={(e) => setCapital(e.target.value)}
                                className="mt-1 block w-full border rounded p-2"
                                required
                            />
                        </label>
                    </div>
                    
                    <div>
                        <label className="block mb-2">
                            Continent:
                            <select
                                value={continent}
                                onChange={(e) => setContinent(e.target.value)}
                                className="mt-1 block w-full border rounded p-2"
                                required
                            >
                                <option value="">Select Continent</option>
                                {CONTINENTS.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    
                    <div>
                        <label className="block mb-2">
                            Country Code (ISO):
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toLowerCase())}
                                className="mt-1 block w-full border rounded p-2"
                                placeholder="e.g. us, fr, jp"
                            />
                            <small className="text-gray-500">2-letter ISO code (optional)</small>
                        </label>
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block mb-2 flex items-center">
                            <input
                                type="checkbox"
                                checked={inGeoguessr}
                                onChange={(e) => setInGeoguessr(e.target.checked)}
                                className="mr-2"
                            />
                            Available in GeoGuessr
                        </label>
                    </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        {loading ? 'Saving...' : editingCountry ? 'Update Country' : 'Add Country'}
                    </button>
                    
                    {editingCountry && (
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
            
            {/* Countries List */}
            <div>
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Countries List</h2>
                    <input
                        type="text"
                        placeholder="Search countries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border rounded p-2 w-64"
                    />
                </div>
                
                <div className="bg-white shadow overflow-x-auto rounded-lg">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capital</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Continent</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In GeoGuessr</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && countries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center">Loading countries...</td>
                                </tr>
                            ) : filteredCountries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center">No countries found</td>
                                </tr>
                            ) : (
                                filteredCountries.map(country => {
                                    // Get the country ID, whether it's stored as id or _id
                                    const countryId = country.id || country._id;
                                    return (
                                        <tr key={countryId}>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.capital}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.continent}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {country.in_geoguessr ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(country)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(countryId || '')}
                                                    disabled={deleting === countryId}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    {deleting === countryId ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CountryAdmin; 