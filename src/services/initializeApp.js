import { initializeAppData } from './jsonbin-new';
import { getFinalConfig } from '../config/jsonbin'; // Import getFinalConfig
import toast from 'react-hot-toast';

// This function initializes the app by connecting to JSONBin
// and loading the initial data
export const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app and connecting to JSONBin...');

    // Configuration with fallbacks
    const apiKey = process.env.REACT_APP_JSONBIN_API_KEY || '$2a$10$Twch63QhrK5EKGmGCrECfOxy0whAiFxFGWcDyOdWoKpuO0cpaIBge';
    const binId = process.env.REACT_APP_JSONBIN_BIN_ID || '68b44389d0ea881f406cf3ea';

    console.log('🔧 Configuration Check:');
    console.log(`✅ API Key: ${apiKey ? '[config present]' : 'MISSING'}`);
    console.log(`✅ Bin ID: ${binId}`);
    // Use the baseUrl from getFinalConfig for accurate logging
    const { baseUrl: finalBaseUrl } = getFinalConfig();
    console.log(`🔗 JSONBin URL: ${finalBaseUrl}/${binId}`);

    if (!apiKey || !binId) {
      console.warn('⚠️ Using fallback configuration');
      toast.error('Using fallback configuration - some data may not persist.', {
        duration: 3000,
        icon: '⚠️',
      });
      return false;
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