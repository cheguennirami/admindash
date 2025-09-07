import { initializeAppData } from './jsonbin-new';
import { getFinalConfig } from '../config/jsonbin'; // Import getFinalConfig
import toast from 'react-hot-toast';

// This function initializes the app by connecting to JSONBin
// and loading the initial data
export const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app and connecting to JSONBin...');

    // Get configuration with fallbacks
    const { apiKey, binId, baseUrl, isUsingFallback } = getFinalConfig();

    console.log('🔧 Configuration Check:');
    console.log(`✅ API Key: ${apiKey ? '[config present]' : 'MISSING'}`);
    console.log(`✅ Bin ID: ${binId}`);
    console.log(`🔗 JSONBin URL: ${baseUrl}/${binId}`);
    if (isUsingFallback) {
      console.warn('⚠️ Using fallback configuration');
    }

    if (!apiKey || !binId) {
      toast.error('JSONBin API Key or Bin ID is missing. Using local storage.', {
        duration: 3000,
        icon: '⚠️',
      });
      return false;
    }
    if (isUsingFallback) {
      toast.error('Using fallback configuration - some data may not persist.', {
        duration: 3000,
        icon: '⚠️',
      });
    }
    
    // Initialize data from JSONBin
    const data = await initializeAppData();
    
    if (data) {
      console.log('Successfully connected to JSONBin');
      toast.success('Connected to JSONBin successfully');
      return true;
    } else {
      console.warn('Failed to load data from JSONBin');
      toast.error('Failed to connect to JSONBin. Using local storage.');
      return false;
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    toast.error('Error connecting to JSONBin. Using local storage.');
    return false;
  }
};