import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Define ICurrency interface locally or import if shared
interface ICurrency {
    name: string;
    symbol: string;
    code: string;
}

interface Country {
    _id?: string;  // Use optional _id
    id?: string;   // Also allow id
    name: string;
    capital: string;
    continent: string;
    code?: string; // Make optional
    in_geoguessr: boolean;
    domain?: string[];
    currency?: ICurrency[];
    population?: number;
    area?: number;
    phone_prefix?: string;
    driving_side?: 'left' | 'right';
    camera_generation?: Record<string, string>; // Use Record for React state
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
    const [domain, setDomain] = useState(''); // Comma-separated string for input
    const [population, setPopulation] = useState<number | ''>('');
    const [area, setArea] = useState<number | ''>('');
    const [phonePrefix, setPhonePrefix] = useState('');
    const [drivingSide, setDrivingSide] = useState<'left' | 'right' | ''>('');
    const [currencies, setCurrencies] = useState<ICurrency[]>([]);
    const [cameraGenerations, setCameraGenerations] = useState<[string, string][]>([]); // Array of [key, value] pairs

    // Mode state
    const [editMode, setEditMode] = useState<'form' | 'json'>('form');
    const [jsonInput, setJsonInput] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);

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
            // Ensure camera_generation is treated as Record<string, string> or undefined
            const fetchedCountries = response.data.countries.map((country: any) => ({
                ...country,
                // Convert Mongoose Map to plain object if necessary
                camera_generation: country.camera_generation && typeof country.camera_generation === 'object' && !(country.camera_generation instanceof Array)
                    ? country.camera_generation
                    : undefined
            }));
            setCountries(fetchedCountries);
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
        setDomain(country.domain?.join(', ') || '');
        setPopulation(country.population ?? '');
        setArea(country.area ?? '');
        setPhonePrefix(country.phone_prefix || '');
        setDrivingSide(country.driving_side || '');
        setCurrencies(country.currency || []);
        // Ensure camera_generation is handled correctly
        const camGen = country.camera_generation;
        setCameraGenerations(camGen ? Object.entries(camGen) : []);
        // Also populate JSON input for potential switch
        generateJsonInput(country);
        scrollToForm();
    };

    const handleDelete = async (countryId: string) => {
        if (!window.confirm('Are you sure you want to delete this country? This action cannot be undone and will fail if the country is used in bollards or license plates.')) {
            return;
        }

        setDeleting(countryId);
        try {
            const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
            if (!apiKey) {
                throw new Error('API key not found. Please log in again.');
            }

            await axios.delete(`/api/countries/${countryId}`, {
                headers: { 'X-API-Key': apiKey }
            });
            setCountries(prev => prev.filter(c => (c.id || c._id) !== countryId));
            setFormSuccess('Country deleted successfully');
            clearFormMessages();
            if (editingCountry && (editingCountry.id || editingCountry._id) === countryId) {
                resetForm();
            }
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
        setDomain('');
        setPopulation('');
        setArea('');
        setPhonePrefix('');
        setDrivingSide('');
        setCurrencies([]);
        setCameraGenerations([]);
        setFormError(null);
        setFormSuccess(null);
        // Reset JSON mode state
        setJsonInput('');
        setJsonError(null);
        setEditMode('form');
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

    // --- Currency Handlers ---
    const handleCurrencyChange = (index: number, field: keyof ICurrency, value: string) => {
        const updatedCurrencies = [...currencies];
        updatedCurrencies[index] = { ...updatedCurrencies[index], [field]: value };
        setCurrencies(updatedCurrencies);
    };

    const addCurrency = () => {
        setCurrencies([...currencies, { name: '', symbol: '', code: '' }]);
    };

    const removeCurrency = (index: number) => {
        setCurrencies(currencies.filter((_, i) => i !== index));
    };

    // --- Camera Generation Handlers ---
    const handleCameraGenerationChange = (index: number, type: 'key' | 'value', value: string) => {
        const updatedGenerations = [...cameraGenerations];
        updatedGenerations[index] = type === 'key'
            ? [value, updatedGenerations[index][1]]
            : [updatedGenerations[index][0], value];
        setCameraGenerations(updatedGenerations);
    };

    const addCameraGeneration = () => {
        setCameraGenerations([...cameraGenerations, ['', '']]); // Add an empty [key, value] pair
    };

    const removeCameraGeneration = (index: number) => {
        setCameraGenerations(cameraGenerations.filter((_, i) => i !== index));
    };

    // --- JSON Mode Helpers ---
    const generateJsonInput = (countryData: Partial<Country> | null = null) => {
        const data = countryData || { // Use current form state if no country provided
            name: name,
            capital: capital,
            continent: continent,
            code: code || undefined,
            in_geoguessr: inGeoguessr,
            domain: domain.split(',').map(d => d.trim()).filter(d => d),
            population: population === '' ? undefined : Number(population),
            area: area === '' ? undefined : Number(area),
            phone_prefix: phonePrefix || undefined,
            driving_side: drivingSide || undefined,
            currency: currencies.filter(c => c.name && c.symbol && c.code),
            camera_generation: Object.fromEntries(cameraGenerations.filter(([key, value]) => key && value)),
            // Include _id if editing
            _id: editingCountry?._id,
            id: editingCountry?.id
        };
        // Clean up undefined fields before stringifying
        const cleanedData: any = {};
        for (const key in data) {
            if ((data as any)[key] !== undefined && (data as any)[key] !== null) {
                // Special handling for empty arrays/objects if desired, but keep for now
                cleanedData[key] = (data as any)[key];
            }
        }
        setJsonInput(JSON.stringify(cleanedData, null, 2)); // Pretty print
        setJsonError(null);
    };
    
    const switchToJSON = () => {
        generateJsonInput(); // Generate JSON from current form state
        setEditMode('json');
        setFormError(null); // Clear form errors when switching mode
    };
    
    const switchToForm = () => {
        try {
            const parsedData = JSON.parse(jsonInput);
            if (typeof parsedData !== 'object' || parsedData === null) {
                throw new Error('Invalid JSON structure: Must be an object.');
            }
            // Update form state from parsed JSON
            setName(parsedData.name || '');
            setCapital(parsedData.capital || '');
            setContinent(parsedData.continent || '');
            setCode(parsedData.code || '');
            setInGeoguessr(parsedData.in_geoguessr || false);
            setDomain(Array.isArray(parsedData.domain) ? parsedData.domain.join(', ') : '');
            setPopulation(parsedData.population ?? '');
            setArea(parsedData.area ?? '');
            setPhonePrefix(parsedData.phone_prefix || '');
            setDrivingSide(parsedData.driving_side || '');
            setCurrencies(Array.isArray(parsedData.currency) ? parsedData.currency : []);
            const camGen = parsedData.camera_generation;
            setCameraGenerations(camGen && typeof camGen === 'object' ? Object.entries(camGen) : []);
            
            // If it includes an ID, set editingCountry to ensure updates work correctly
            if (parsedData._id || parsedData.id) {
                // Basic object to signify editing, might need full fetch if complex logic depends on it
                setEditingCountry({ ...parsedData, _id: parsedData._id || parsedData.id });
            } else {
                setEditingCountry(null);
            }
            
            setEditMode('form');
            setJsonError(null);
        } catch (error: any) {
            setJsonError(`Invalid JSON: ${error.message}`);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!name || !capital || !continent) {
            setFormError('Name, capital, and continent are required');
            clearFormMessages();
            return;
        }

        const populationNum = population === '' ? undefined : Number(population);
        const areaNum = area === '' ? undefined : Number(area);
        if (population !== '' && isNaN(populationNum as number)) {
            setFormError('Population must be a valid number'); clearFormMessages(); return;
        }
        if (area !== '' && isNaN(areaNum as number)) {
            setFormError('Area must be a valid number'); clearFormMessages(); return;
        }

        // Validate partially filled currency/camgen entries
        const invalidCurrency = currencies.some(c => (c.name || c.symbol || c.code) && (!c.name || !c.symbol || !c.code));
        if (invalidCurrency) {
            setFormError('Fill all fields (name, symbol, code) for each currency, or remove incomplete ones.'); clearFormMessages(); return;
        }
        const invalidGeneration = cameraGenerations.some(([key, value]) => (key || value) && (!key || !value));
        if (invalidGeneration) {
            setFormError('Fill both Key and Value for each camera generation, or remove incomplete ones.'); clearFormMessages(); return;
        }

        setLoading(true); setFormError(null); setFormSuccess(null);

        let submissionData: Partial<Country> | null = null;

        if (editMode === 'json') {
            try {
                const parsedJson = JSON.parse(jsonInput);
                if (typeof parsedJson !== 'object' || parsedJson === null) {
                    throw new Error('Invalid JSON structure: Must be an object.');
                }
                // Basic validation - ensure required fields for creation are present if not editing
                if (!editingCountry && (!parsedJson.name || !parsedJson.capital || !parsedJson.continent)) {
                    throw new Error('Missing required fields (name, capital, continent) in JSON for new country.');
                }
                 // Further validation could be added here (e.g., type checks)
                submissionData = parsedJson;
                 setJsonError(null); // Clear JSON error on successful parse
            } catch (error: any) {
                setJsonError(`Invalid JSON for submission: ${error.message}`);
                setLoading(false);
                return;
            }
        } else {
            // Prepare data from FORM state
            const finalCurrencies = currencies.filter(c => c.name && c.symbol && c.code);
            const finalCameraGeneration = Object.fromEntries(
                cameraGenerations.filter(([key, value]) => key && value)
            );
            submissionData = {
                name,
                capital,
                continent,
                code: code || undefined,
                in_geoguessr: inGeoguessr,
                domain: domain.split(',').map(d => d.trim()).filter(d => d),
                population: populationNum,
                area: areaNum,
                phone_prefix: phonePrefix || undefined,
                driving_side: drivingSide || undefined,
                currency: finalCurrencies.length > 0 ? finalCurrencies : undefined,
                camera_generation: Object.keys(finalCameraGeneration).length > 0 ? finalCameraGeneration : undefined
            };
            // If editing, ensure the _id is included for the PUT request
            if (editingCountry) {
                 (submissionData as any)._id = editingCountry._id || editingCountry.id;
            }
        }

        if (!submissionData) { // Should not happen, but safeguard
             setFormError('Failed to prepare submission data.');
             setLoading(false);
             return;
        }

        const apiKey = localStorage.getItem('apiKey') || process.env.REACT_APP_ADMIN_API_KEY;
        if (!apiKey) {
            setFormError('API key not found.'); clearFormMessages(); setLoading(false); return;
        }

        // Use the prepared submissionData
        const finalSubmissionData = { ...submissionData };

        try {
            let response;
            const config = { headers: { 'X-API-Key': apiKey } };

            // Helper function to process response data
             const processCountryData = (data: any): Country => ({
                ...data,
                 camera_generation: data.camera_generation && typeof data.camera_generation === 'object' && !(data.camera_generation instanceof Array)
                    ? data.camera_generation
                    : undefined
            });

            if (editingCountry) {
                const countryId = editingCountry.id || editingCountry._id || (finalSubmissionData as any)._id || (finalSubmissionData as any).id;
                if (!countryId) throw new Error('Missing country ID for update');
                response = await axios.put(`/api/countries/${countryId}`, finalSubmissionData, config);
                const updatedCountry = processCountryData(response.data.country);
                setCountries(prev => prev.map(c => (c.id || c._id) === countryId ? updatedCountry : c));
                setFormSuccess('Country updated successfully');
            } else {
                response = await axios.post('/api/countries', finalSubmissionData, config);
                const newCountry = processCountryData(response.data.country);
                setCountries(prev => [...prev, newCountry]);
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

    const handleCopyJsonAndEdit = async (country: Country) => {
        // Generate clean JSON string
        const dataToCopy: any = { ...country }; // Clone to avoid modifying state directly
        // Remove potential React/internal state properties if they creep in
        delete dataToCopy.id; // Prefer _id from DB

        // Clean up undefined/null and ensure camera_generation is an object
        const cleanedData: any = {};
         for (const key in dataToCopy) {
            if ((dataToCopy as any)[key] !== undefined && (dataToCopy as any)[key] !== null) {
                 if (key === 'camera_generation' && typeof dataToCopy[key] === 'object') {
                     cleanedData[key] = dataToCopy[key]; // Already an object likely
                 } else if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v') {
                     // Exclude mongo internal fields except _id for copying
                     cleanedData[key] = dataToCopy[key];
                 }
            }
         }
         // Ensure _id is present if it exists on original
         if(country._id) cleanedData._id = country._id;

        const jsonString = JSON.stringify(cleanedData, null, 2);

        try {
            await navigator.clipboard.writeText(jsonString);
            // Set edit state
            handleEdit(country); // This populates form state + jsonInput
            setEditMode('json');
            setFormSuccess('JSON copied to clipboard. Switched to JSON edit mode.');
            clearFormMessages(); // Clear message after a delay
            scrollToForm();
        } catch (err) {
            console.error('Failed to copy JSON: ', err);
            setFormError('Failed to copy JSON to clipboard.');
            clearFormMessages();
        }
    };

    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.capital.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.continent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code?.toLowerCase().includes(searchTerm.toLowerCase()) || // Ensure || exists
        country.phone_prefix?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper to format camera generation map/object
    const formatCameraGeneration = (gen?: Record<string, string>) => {
        if (!gen || Object.keys(gen).length === 0) return 'N/A';
        return Object.entries(gen).map(([key, value]) => `${key}: ${value}`).join(', ');
    };

    return (
        <div className="max-w-[90rem] mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Country Admin</h1>

            {/* Country Form */}
            <div className="mb-8 p-4 border rounded-lg bg-white shadow">
                <h2 className="text-xl font-semibold mb-4">
                    {editingCountry ? 'Edit Country' : 'Add New Country'}
                </h2>

                {/* Mode Toggle Buttons */}
                <div className="mb-4 flex space-x-2">
                    <button 
                        type="button"
                        onClick={switchToForm}
                        disabled={editMode === 'form'}
                        className={`px-3 py-1 rounded ${editMode === 'form' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        Form Mode
                    </button>
                    <button 
                        type="button"
                        onClick={switchToJSON}
                        disabled={editMode === 'json'}
                        className={`px-3 py-1 rounded ${editMode === 'json' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        JSON Mode
                    </button>
                </div>

                {formError && ( <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{formError}</div> )}
                {formSuccess && ( <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{formSuccess}</div> )}

                {/* Conditional Form / JSON Input Area */}
                {editMode === 'form' ? (
                  <form id="countryForm" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                            <label className="block mb-2">Country Name:
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded p-2" required />
                            </label>
                        </div>
                        {/* Capital */}
                        <div>
                            <label className="block mb-2">Capital:
                                <input type="text" value={capital} onChange={(e) => setCapital(e.target.value)} className="mt-1 block w-full border rounded p-2" required />
                            </label>
                        </div>
                        {/* Continent */}
                        <div>
                            <label className="block mb-2">Continent:
                                <select value={continent} onChange={(e) => setContinent(e.target.value)} className="mt-1 block w-full border rounded p-2" required>
                                    <option value="">Select Continent</option>
                                    {CONTINENTS.map(c => ( <option key={c} value={c}>{c}</option> ))}
                                </select>
                            </label>
                        </div>
                        {/* Code */}
                        <div>
                            <label className="block mb-2">Country Code (ISO):
                                <input type="text" value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} className="mt-1 block w-full border rounded p-2" placeholder="e.g. us, fr, jp" />
                                <small className="text-gray-500">2-letter ISO code (optional)</small>
                            </label>
                        </div>
                        {/* Domain */}
                        <div className="md:col-span-2">
                            <label className="block mb-2">Domains (comma-separated):
                                <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} className="mt-1 block w-full border rounded p-2" placeholder="e.g. .us, .co.uk" />
                            </label>
                        </div>
                        {/* Population */}
                        <div>
                            <label className="block mb-2">Population:
                                <input type="number" value={population} onChange={(e) => setPopulation(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full border rounded p-2" placeholder="e.g. 331000000" />
                            </label>
                        </div>
                        {/* Area */}
                        <div>
                            <label className="block mb-2">Area (km²):
                                <input type="number" value={area} onChange={(e) => setArea(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full border rounded p-2" placeholder="e.g. 9833520" />
                            </label>
                        </div>
                        {/* Phone Prefix */}
                        <div>
                            <label className="block mb-2">Phone Prefix:
                                <input type="text" value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)} className="mt-1 block w-full border rounded p-2" placeholder="e.g. +1" />
                            </label>
                        </div>
                        {/* Driving Side */}
                        <div>
                            <label className="block mb-2">Driving Side:
                                <select value={drivingSide} onChange={(e) => setDrivingSide(e.target.value as 'left' | 'right' | '')} className="mt-1 block w-full border rounded p-2">
                                    <option value="">Select Side</option>
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                </select>
                            </label>
                        </div>

                        {/* --- Currency Section --- */}
                        <div className="md:col-span-2 border-t pt-4 mt-4">
                            <h3 className="text-lg font-semibold mb-2">Currencies</h3>
                            {currencies.map((currency, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 items-center">
                                    <input type="text" placeholder="Name (e.g. US Dollar)" value={currency.name} onChange={(e) => handleCurrencyChange(index, 'name', e.target.value)} className="border rounded p-2" />
                                    <input type="text" placeholder="Symbol (e.g. $)" value={currency.symbol} onChange={(e) => handleCurrencyChange(index, 'symbol', e.target.value)} className="border rounded p-2" />
                                    <input type="text" placeholder="Code (e.g. USD)" value={currency.code} onChange={(e) => handleCurrencyChange(index, 'code', e.target.value)} className="border rounded p-2" />
                                    <button type="button" onClick={() => removeCurrency(index)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm h-fit">Remove</button>
                                </div>
                            ))}
                            <button type="button" onClick={addCurrency} className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Add Currency</button>
                        </div>

                        {/* --- Camera Generation Section --- */}
                        <div className="md:col-span-2 border-t pt-4 mt-4">
                            <h3 className="text-lg font-semibold mb-2">Camera Generations</h3>
                            {cameraGenerations.map(([key, value], index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 items-center">
                                    <input type="text" placeholder="Key (e.g. gen1)" value={key} onChange={(e) => handleCameraGenerationChange(index, 'key', e.target.value)} className="border rounded p-2" />
                                    <input type="text" placeholder="Value (e.g. 5.5%)" value={value} onChange={(e) => handleCameraGenerationChange(index, 'value', e.target.value)} className="border rounded p-2" />
                                    <button type="button" onClick={() => removeCameraGeneration(index)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm h-fit">Remove</button>
                                </div>
                            ))}
                            <button type="button" onClick={addCameraGeneration} className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Add Generation</button>
                        </div>

                        {/* In GeoGuessr */}
                        <div className="md:col-span-2 mt-4">
                            <label className="block mb-2 flex items-center">
                                <input type="checkbox" checked={inGeoguessr} onChange={(e) => setInGeoguessr(e.target.checked)} className="mr-2" />
                                Available in GeoGuessr
                            </label>
                        </div>
                    </div>

                    {/* Form Buttons */}
                    <div className="mt-6 flex space-x-2">
                        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300">
                            {loading ? 'Saving...' : editingCountry ? 'Update Country' : 'Add Country'}
                        </button>
                        {editingCountry && (
                            <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancel Edit</button>
                        )}
                    </div>
                  </form>
                ) : (
                  // JSON Mode
                  <div>
                      <textarea
                          value={jsonInput}
                          onChange={(e) => {
                              setJsonInput(e.target.value);
                              setJsonError(null); // Clear error on typing
                          }}
                          className="w-full h-96 border rounded p-2 font-mono text-sm"
                          placeholder='Paste or edit country JSON here...'
                      />
                      {jsonError && (
                          <div className="mt-2 text-red-600 text-sm">{jsonError}</div>
                      )}
                      {/* Buttons for JSON mode */} 
                      <div className="mt-4 flex space-x-2">
                        <button 
                            type="button" 
                            onClick={handleSubmit} // Reuse handleSubmit for JSON submission
                            disabled={loading}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                        >
                            {loading ? 'Saving JSON...' : editingCountry ? 'Update from JSON' : 'Create from JSON'}
                        </button>
                        {editingCountry && (
                            <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancel Edit</button>
                        )}
                      </div>
                  </div>
                )}
            </div>

            {/* Countries List */}
            <div>
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Countries List</h2>
                    <input type="text" placeholder="Search countries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border rounded p-2 w-64" />
                </div>

                <div className="bg-white shadow overflow-x-auto rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capital</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Continent</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In GeoGuessr</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Population</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area (km²)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Prefix</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driving Side</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cam Gen</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && countries.length === 0 ? (
                                <tr><td colSpan={13} className="px-6 py-4 text-center">Loading countries...</td></tr>
                            ) : filteredCountries.length === 0 ? (
                                <tr><td colSpan={13} className="px-6 py-4 text-center">No countries found</td></tr>
                            ) : (
                                filteredCountries.map(country => {
                                    const countryId = country.id || country._id;
                                    return (
                                        <tr key={countryId}>
                                            <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">{country.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.capital}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.continent}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.code || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {country.in_geoguessr ? ( <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Yes</span> ) : ( <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">No</span> )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.domain?.join(', ') || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.currency?.map(c => `${c.name} (${c.symbol}, ${c.code})`).join('; ') || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.population?.toLocaleString() || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.area?.toLocaleString() || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.phone_prefix || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{country.driving_side || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{formatCameraGeneration(country.camera_generation) || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white space-x-2">
                                                <button onClick={() => handleEdit(country)} className="text-indigo-600 hover:text-indigo-900" title="Edit in Form Mode">Edit</button>
                                                <button 
                                                    onClick={() => handleCopyJsonAndEdit(country)} 
                                                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100" 
                                                    title="Copy JSON & Edit in JSON Mode"
                                                >
                                                    <span className="font-mono text-xs">{'{ }'}</span>
                                                </button>
                                                <button onClick={() => handleDelete(countryId || '')} disabled={deleting === countryId} className="text-red-600 hover:text-red-900 disabled:text-gray-400" title="Delete Country">
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