# Changelog

All notable changes to the MakeupOcean Mobile App will be documented in this file.

## [1.1.0] - 2026-02-01

### Added
- **Splash Screen**: Auth check on app launch with automatic navigation
- **expo-auth-session**: In-app Google OAuth with fallback to web browser
- **expo-splash-screen**: Proper splash screen handling
- **Payment Verification**: Secure payment signature verification after checkout
- **FlashList**: High-performance list rendering for home screen

### Changed
- **Home Screen Performance**: Migrated from FlatList to FlashList (5x faster)
- **ProductSliderSection**: Memoized component with FlashList horizontal lists
- **ProductGridSection**: Memoized component with FlashList grid layout
- **Navigation**: App now starts at Splash screen instead of Login
- **User Store**: Added hydration state tracking for proper auth checks
- **Razorpay Checkout**: Now verifies payment on backend after success

### Performance
- Reduced home screen re-renders with React.memo
- Optimized useCallback hooks for navigation handlers
- Added skeleton loaders for horizontal lists
- Improved image loading with proper height containers

### Dependencies Added
- `@shopify/flash-list` - High-performance lists
- `expo-auth-session` - In-app OAuth
- `expo-crypto` - Cryptographic functions
- `expo-splash-screen` - Native splash screen control

## [1.0.0] - Initial Release

### Features
- WooCommerce product browsing
- Category and brand filtering
- Shopping cart with variations
- Razorpay payment integration
- Google OAuth and email/password auth
- Order history and tracking
- Wishlist management
- Address management
- Push notifications
- Glassmorphism UI components
