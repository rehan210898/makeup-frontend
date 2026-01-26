import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return {
    BlurView: View,
  };
});

jest.mock('expo-image', () => {
    const { View } = require('react-native');
    return {
      Image: View,
    };
});

jest.mock('react-native-toast-message', () => ({
    show: jest.fn(),
    hide: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));

jest.mock('react-native-svg', () => {
    const React = require('react');
    const { View } = require('react-native');
    const Svg = (props) => React.createElement(View, props);
    const Circle = (props) => React.createElement(View, props);
    const Line = (props) => React.createElement(View, props);
    return {
      __esModule: true,
      default: Svg,
      Circle,
      Line,
      Svg
    };
});

jest.mock('expo-font', () => ({
    isLoaded: jest.fn(() => true),
    loadAsync: jest.fn(),
}));

// Mock animations to avoid complexity in tests
jest.mock('./src/components/home/FashionMicroAnimations', () => ({ FashionMicroAnimations: () => null }));
jest.mock('./src/components/home/BeautyMicroAnimations', () => ({ BeautyMicroAnimations: () => null }));
jest.mock('./src/components/home/FloatingIconsBackground', () => ({ FloatingIconsBackground: () => null }));
