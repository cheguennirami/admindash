import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initializeApp } from './services/initializeApp';
import { Toaster } from 'react-hot-toast';

// Initialize connection to JSONBin
initializeApp().then(connected => {
  console.log('JSONBin connection status:', connected ? 'Connected' : 'Using local storage');
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Global toast container for initialization messages */}
    <Toaster 
      position="top-center"
      toastOptions={{
        className: 'initialization-toast',
        duration: 5000,
      }}
    />
    <App />
  </React.StrictMode>
);
