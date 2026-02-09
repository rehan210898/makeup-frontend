import Constants from 'expo-constants';

// API Configuration
const PROD_URL = 'https://woocommerce-bff-muo.onrender.com/api/v1';
// Ensure this IP matches your computer's IP address (ipconfig/ifconfig)
const DEV_URL = 'http://192.168.2.105:3000/api/v1';

// Use DEV_URL only in Expo Go during local development, PROD_URL for all builds
const BASE_URL = __DEV__ && Constants.appOwnership === 'expo' ? DEV_URL : PROD_URL;

export const API_CONFIG = {
  BASE_URL,
  API_KEY: '5aa92e6b5a9c561fff47ea95c872fc9b5c52652735029cb9fdf271eb9fc1e4fa',
  TIMEOUT: 30000,
};

// Colors - Stitch UI Pink/Magenta Theme
export const COLORS = {
  // Primary colors
  primary: '#661F1D',           // Pink/Magenta (main brand color)
  primaryDark: '#C2185B',       // Darker pink for pressed states
  primaryLight: '#F06292',      // Lighter pink for accents
  primarySoft: '#F8BBD0',       // Very soft pink for backgrounds

  // Secondary/Accent colors
  accent: '#D4AF37',            // Gold (kept from original)
  accentDark: '#C5A028',
  accentLight: '#F4E09E',
  secondary: '#D4AF37',         // Alias for accent
  secondaryLight: '#F4E09E',

  // Backgrounds
  white: '#FFFFFF',
  black: '#000000',
  background: '#FFFFFF',        // Clean white background
  backgroundSubtle: '#FFF5F8',  // Subtle pink-tinted background
  backgroundDark: '#211116',    // Dark mode / dark sections
  cream: '#FFF5F8',             // Updated cream to pink-tinted
  creamDark: '#F8BBD0',

  // Grays
  gray: {
    50: '#FAFAFA',
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

  // Text colors
  text: {
    main: '#2D1B22',            // Dark text for headings
    primary: '#2D1B22',
    secondary: '#9A7B86',       // Muted pink-gray for secondary text
    muted: '#9A7B86',
  },

  // Status colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Online status
  online: '#4CAF50',

  // Pastel backgrounds for products
  pastels: [
    '#FFF0F5', // Lavender blush
    '#F0FFF0', // Honeydew
    '#FFF5EE', // Seashell
    '#F0F8FF', // Alice blue
    '#FFFAF0', // Floral white
    '#F5FFFA', // Mint cream
    '#FFF0F0', // Light pink
    '#F0FFFF', // Azure
    '#FFFFF0', // Ivory
    '#FDF5E6', // Old lace
  ],
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: '@user_token',
  USER_DATA: '@user_data',
  CART: '@cart',
  WISHLIST: '@wishlist',
};