import React from 'react';
import { AlertCircle, CheckCircle, Loader, Wifi, WifiOff } from 'lucide-react';

const DataStatus = ({ status, message, retry }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-5 w-5 text-orange-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Wifi className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'offline':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Connecting to database...';
      case 'connected':
        return 'Connected to JSONBin';
      case 'offline':
        return 'Offline mode';
      case 'error':
        return 'Connection error';
      default:
        return 'Status unknown';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-lg border ${getStatusColor()} max-w-sm shadow-lg z-50`}>
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{getTitle()}</div>
          {message && (
            <div className="text-sm opacity-75 mt-1">{message}</div>
          )}
          {retry && status === 'error' && (
            <button
              onClick={retry}
              className="text-sm underline hover:no-underline mt-1 focus:outline-none"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataStatus;