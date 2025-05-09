'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TestMongoDB() {
  const [status, setStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    error?: string;
    database?: any;
  }>({
    loading: true
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await axios.get('/api/test-mongodb');
        setStatus({
          loading: false,
          success: response.data.success,
          message: response.data.message,
          database: response.data.database
        });
      } catch (error: any) {
        setStatus({
          loading: false,
          success: false,
          error: error.response?.data?.error || error.message || 'An unknown error occurred'
        });
      }
    };

    testConnection();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">MongoDB Connection Test</h1>
      
      {status.loading ? (
        <div className="p-4 bg-blue-100 text-blue-700 rounded">
          Testing MongoDB connection...
        </div>
      ) : status.success ? (
        <div className="p-4 bg-green-100 text-green-700 rounded mb-6">
          <p className="font-bold">{status.message}</p>
        </div>
      ) : (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-6">
          <p className="font-bold">Connection failed</p>
          <p>{status.error}</p>
        </div>
      )}

      {status.database && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Database Information</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Database Name:</strong> {status.database.name}</p>
            
            <h3 className="text-xl font-bold mt-4 mb-2">Statistics</h3>
            <ul className="list-disc pl-6">
              <li>Collections: {status.database.stats.collections}</li>
              <li>Objects: {status.database.stats.objects}</li>
              <li>Indexes: {status.database.stats.indexes}</li>
              <li>Data Size: {(status.database.stats.dataSize / (1024 * 1024)).toFixed(2)} MB</li>
              <li>Storage Size: {(status.database.stats.storageSize / (1024 * 1024)).toFixed(2)} MB</li>
            </ul>
            
            <h3 className="text-xl font-bold mt-4 mb-2">Collections</h3>
            {status.database.collections.length > 0 ? (
              <ul className="list-disc pl-6">
                {status.database.collections.map((collection: string) => (
                  <li key={collection}>{collection}</li>
                ))}
              </ul>
            ) : (
              <p>No collections found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
