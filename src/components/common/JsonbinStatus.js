import React, { useState, useEffect } from 'react';
import { initializeAppData } from '../../services/jsonbin-simple';

const JsonbinStatus = () => {
  const [status, setStatus] = useState('checking');
  const [binId, setBinId] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if JSONBin credentials are configured
        const apiKey = process.env.REACT_APP_JSONBIN_API_KEY;
        const binId = process.env.REACT_APP_JSONBIN_BIN_ID;
        
        if (!apiKey || !binId) {
          setStatus('not-configured');
          return;
        }
        
        setBinId(binId);
        
        // Try to initialize data from JSONBin
        const data = await initializeAppData();
        
        if (data) {
          setStatus('connected');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error checking JSONBin connection:', error);
        setStatus('error');
      }
    };

    checkConnection();
  }, []);

  // Render different status indicators
  const renderStatus = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            <span>JSONBin Connected</span>
            <span className="ml-2 text-xs text-gray-500">({binId.substring(0, 8)}...)</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
            <span>JSONBin Error</span>
            <span className="ml-2 text-xs text-gray-500">(Using Local Storage)</span>
          </div>
        );
      case 'not-configured':
        return (
          <div className="flex items-center text-yellow-600">
            <div className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></div>
            <span>JSONBin Not Configured</span>
            <span className="ml-2 text-xs text-gray-500">(Using Local Storage)</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
            <span>Checking JSONBin...</span>
          </div>
        );
    }
  };

  return (
    <div className="text-sm font-medium">
      {renderStatus()}
    </div>
  );
};

export default JsonbinStatus;