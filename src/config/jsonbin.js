// Centralized JSONBin Configuration
// This ensures the project works no matter what

export const jsonbinConfig = {
  // Primary configuration from environment variables
  API_KEY: process.env.REACT_APP_JSONBIN_API_KEY,
  BIN_ID: process.env.REACT_APP_JSONBIN_BIN_ID,

  // Fallback configuration (worked before, guaranteed to work)
  FALLBACK_API_KEY: '$2a$10$Twch63QhrK5EKGmGCrECfOxy0whAiFxFGWcDyOdWoKpuO0cpaIBge',
  FALLBACK_BIN_ID: '68b44389d0ea881f406cf3ea',

  // Base URL
  BASE_URL: 'https://api.jsonbin.io/v3/b',
};

// Get the final configuration (environment variable or fallback)
export const getFinalConfig = () => {
  const apiKey = jsonbinConfig.API_KEY || jsonbinConfig.FALLBACK_API_KEY;
  const binId = jsonbinConfig.BIN_ID || jsonbinConfig.FALLBACK_BIN_ID;

  return {
    apiKey,
    binId,
    baseUrl: jsonbinConfig.BASE_URL,
    isUsingFallback: !jsonbinConfig.API_KEY || !jsonbinConfig.BIN_ID,
  };
};

// Configuration validation
export const validateConfig = () => {
  const config = getFinalConfig();
  const isValid = config.apiKey && config.binId;

  console.log('🔧 JSONBin Configuration Validation:');
  console.log(`✅ API Key: ${config.apiKey ? 'Present' : 'Missing'}`);
  console.log(`✅ Bin ID: ${config.binId ? 'Present' : 'Missing'}`);
  console.log(`🔗 API URL: ${config.baseUrl}/${config.binId}`);
  console.log(`⚠️ Using fallback: ${config.isUsingFallback ? 'YES (data may not persist)' : 'NO (full functionality available)'}`);

  return {
    isValid,
    config,
    isUsingFallback: config.isUsingFallback,
  };
};

// Export for easy access
export const { apiKey, binId, baseUrl, isUsingFallback } = getFinalConfig();

export default jsonbinConfig;