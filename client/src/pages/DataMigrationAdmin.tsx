import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MigrationResult {
  success: boolean;
  message: string;
  migrationResult: {
    acknowledged: boolean;
    modifiedCount: number;
    upsertedId: null;
    upsertedCount: number;
    matchedCount: number;
  };
  beforeCount: number;
  afterCount: number;
  roadSignsBefore: {
    _id: string;
    imageUrl: string;
    description: string;
    isPedestrian: boolean;
    types: string[];
  }[];
  roadSignsAfter: {
    _id: string;
    imageUrl: string;
    description: string;
    isPedestrian: boolean;
    types: string[];
  }[];
}

interface RoadSignDebug {
  _id: string;
  description: string;
  types: string[];
  typesType: string;
  rawData: string;
}

interface DebugResponse {
  success: boolean;
  count: number;
  roadSigns: RoadSignDebug[];
}

interface RoadSignBefore {
  _id: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface RoadSignAfter {
  _id: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  types: string[];
}

const DataMigrationAdmin: React.FC = () => {
  useDocumentTitle('Data Migration Admin');
  
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [allSigns, setAllSigns] = useState<RoadSignDebug[]>([]);
  const [debugLoading, setDebugLoading] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  // Check authentication status on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!isAdmin) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, isAdmin, navigate]);
  
  const handleMigrateTypes = async () => {
    if (!window.confirm('Are you sure you want to migrate road sign types? This will add a types array field to all road signs based on the isPedestrian field.')) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setMigrationResult(null);
    
    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem('apiKey');
      
      if (!apiKey) {
        throw new Error('API key not found. Please log in again.');
      }
      
      const response = await axios.post('/api/roadsigns/migrate-types', {}, {
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      if (response.data.success) {
        setSuccess('Road sign types migration completed successfully!');
        setMigrationResult(response.data);
      } else {
        throw new Error(response.data.message || 'Failed to migrate road sign types');
      }
    } catch (error: any) {
      console.error('Error migrating road sign types:', error);
      setError(error.message || 'Failed to migrate road sign types. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSigns = async () => {
    setDebugLoading(true);
    setError('');
    
    try {
      const apiKey = localStorage.getItem('apiKey');
      
      if (!apiKey) {
        throw new Error('API key not found. Please log in again.');
      }
      
      const response = await axios.get<DebugResponse>('/api/roadsigns/debug', {
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      if (response.data.success) {
        setAllSigns(response.data.roadSigns);
      } else {
        throw new Error('Failed to fetch road sign data');
      }
    } catch (error: any) {
      console.error('Error fetching road signs:', error);
      setError(error.message || 'Failed to fetch road sign data. Please try again.');
    } finally {
      setDebugLoading(false);
    }
  };
  
  // Fetch all signs when the component mounts
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchAllSigns();
    }
  }, [isAuthenticated, isAdmin]);
  
  const toggleRowExpansion = (id: string) => {
    if (expandedRowId === id) {
      setExpandedRowId(null); // collapse if already expanded
    } else {
      setExpandedRowId(id); // expand the clicked row
    }
  };
  
  // Don't render anything if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Data Migration Admin</h1>
      
      {/* Debug authentication state */}
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <p><strong>Authentication State:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
        <p><strong>Admin State:</strong> {isAdmin ? 'Admin' : 'Not Admin'}</p>
        <p><strong>API Key:</strong> {localStorage.getItem('apiKey') ? 'Present' : 'Missing'}</p>
      </div>
      
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
      
      {/* Migration section */}
      <div className="mb-8 p-4 border rounded-lg bg-white shadow">
        <h2 className="text-xl font-semibold mb-4">Road Sign Types Migration</h2>
        <p className="mb-4">
          This migration will convert the <code className="bg-gray-100 px-1 rounded">isPedestrian</code> boolean field 
          to a new <code className="bg-gray-100 px-1 rounded">types</code> array field for all road signs.
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li>If <code className="bg-gray-100 px-1 rounded">isPedestrian</code> is <strong>true</strong>, 
          the sign will have <code className="bg-gray-100 px-1 rounded">["pedestrian"]</code> in its types array.</li>
          <li>If <code className="bg-gray-100 px-1 rounded">isPedestrian</code> is <strong>false</strong>, 
          the sign will have an empty types array <code className="bg-gray-100 px-1 rounded">[]</code>.</li>
        </ul>
        <div className="flex gap-4">
          <button
            onClick={handleMigrateTypes}
            disabled={loading}
            className={`px-4 py-2 rounded focus:outline-none ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {loading ? 'Migrating...' : 'Migrate Road Sign Types'}
          </button>
          <button
            onClick={fetchAllSigns}
            disabled={debugLoading}
            className={`px-4 py-2 rounded focus:outline-none ${
              debugLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {debugLoading ? 'Loading...' : 'Refresh Signs Data'}
          </button>
        </div>
      </div>
      
      {/* Current Database State */}
      <div className="mb-8 p-4 border rounded-lg bg-white shadow">
        <h2 className="text-xl font-semibold mb-4">Current Database State</h2>
        <p className="text-sm text-gray-600 mb-4">Total signs: {allSigns.length}</p>
        
        {debugLoading ? (
          <p className="text-center py-4">Loading signs data...</p>
        ) : (
          <div className="max-h-96 overflow-y-auto bg-gray-50 p-2 rounded">
            <table className="min-w-full divide-y divide-gray-200 mt-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left"></th>
                  <th className="px-2 py-2 text-left">ID</th>
                  <th className="px-2 py-2 text-left">Description</th>
                  <th className="px-2 py-2 text-left">types</th>
                  <th className="px-2 py-2 text-left">types Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allSigns.map(sign => (
                  <React.Fragment key={sign._id}>
                    <tr className="border-t hover:bg-gray-100 cursor-pointer" onClick={() => toggleRowExpansion(sign._id)}>
                      <td className="px-2 py-2">
                        <button className="text-blue-500 hover:text-blue-700">
                          {expandedRowId === sign._id ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="px-2 py-2 text-xs">{sign._id}</td>
                      <td className="px-2 py-2">{sign.description}</td>
                      <td className="px-2 py-2">{sign.types.join(', ') || 'empty array'}</td>
                      <td className="px-2 py-2">{sign.typesType}</td>
                    </tr>
                    {expandedRowId === sign._id && (
                      <tr>
                        <td colSpan={5} className="px-4 py-2 bg-gray-50 border-b">
                          <div className="overflow-x-auto">
                            <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded">
                              {sign.rawData}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Results section */}
      {migrationResult && (
        <div className="mb-8 p-4 border rounded-lg bg-white shadow">
          <h2 className="text-xl font-semibold mb-4">Migration Results</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Statistics</h3>
            <ul className="bg-gray-50 p-2 rounded">
              <li><strong>Total documents:</strong> {migrationResult.beforeCount}</li>
              <li><strong>Matched documents:</strong> {migrationResult.migrationResult.matchedCount}</li>
              <li><strong>Modified documents:</strong> {migrationResult.migrationResult.modifiedCount}</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Before Migration</h3>
              <div className="max-h-60 overflow-y-auto bg-gray-50 p-2 rounded">
                <table className="min-w-full divide-y divide-gray-200 mt-2">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-1 text-left">ID</th>
                      <th className="px-2 py-1 text-left">Image</th>
                      <th className="px-2 py-1 text-left">Types</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {migrationResult.roadSignsBefore.map(sign => (
                      <tr key={sign._id} className="border-t">
                        <td className="px-2 py-1 text-xs">{sign._id}</td>
                        <td className="px-2 py-1">
                          <img src={sign.imageUrl} alt="Road Sign" className="h-10 w-10 object-cover" />
                        </td>
                        <td className="px-2 py-1">{JSON.stringify(sign.types)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">After Migration</h3>
              <div className="max-h-60 overflow-y-auto bg-gray-50 p-2 rounded">
                <table className="min-w-full divide-y divide-gray-200 mt-2">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-1 text-left">ID</th>
                      <th className="px-2 py-1 text-left">Image</th>
                      <th className="px-2 py-1 text-left">Types</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {migrationResult.roadSignsAfter.map(sign => (
                      <tr key={sign._id} className="border-t">
                        <td className="px-2 py-1 text-xs">{sign._id}</td>
                        <td className="px-2 py-1">
                          <img src={sign.imageUrl} alt="Road Sign" className="h-10 w-10 object-cover" />
                        </td>
                        <td className="px-2 py-1">{JSON.stringify(sign.types)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataMigrationAdmin; 