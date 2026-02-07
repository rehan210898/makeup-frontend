module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      process.env.NODE_ENV === 'production' ? 'transform-remove-console' : null,
      'react-native-reanimated/plugin',
    ].filter(Boolean),
  };
};