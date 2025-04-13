import { Platform } from 'react-native';

// For Android emulator, localhost maps to 10.0.2.2
// For iOS simulator, localhost maps to localhost
const DEV_API_URL = Platform.select({
    android: 'http://10.0.2.2:5000',
    ios: 'http://localhost:5000',
    default: 'http://localhost:5000',
});

// Use environment variables or build-time constants for production URL
const PROD_API_URL = 'https://your-production-api.com';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const ENDPOINTS = {
    CREATE_ITINERARY: `${API_URL}/createitinerary`,
    HEALTH_CHECK: `${API_URL}/health`,
}; 