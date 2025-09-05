import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initializeApp } from './services/initializeApp';
import { Toaster } from 'react-hot-toast';
import i18n from './i18n'; // Import the i18n configuration
import { I18nextProvider } from 'react-i18next';

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
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
);
