// API Configuration
// NOTE: Replace 'https://your-backend-app.onrender.com' with your actual deployed URL after Step 1.
const PROD_URL = 'https://woocommerce-bff-muo.onrender.com/api/v1'; 
// Ensure this IP matches your computer's IP address (ipconfig/ifconfig)
const DEV_URL = 'http://192.168.2.105:3000/api/v1'; 

export const API_CONFIG = {
  // Force DEV_URL for now to debug
  BASE_URL: DEV_URL, 
  API_KEY: '5aa92e6b5a9c561fff47ea95c872fc9b5c52652735029cb9fdf271eb9fc1e4fa',
  TIMEOUT: 30000,
};

// Colors
export const COLORS = {
  primary: '#661F1D',
  primaryDark: '#4A1615',
  primaryLight: '#852927',
  cream: '#f9eceb',
  creamDark: '#EBC2B5',
  accent: '#D4AF37',
  accentDark: '#C5A028',
  accentLight: '#f9eceb',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F7F7F7',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: '@user_token',
  USER_DATA: '@user_data',
  CART: '@cart',
  WISHLIST: '@wishlist',
};