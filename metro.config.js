const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Permanent alias for missing Platform.js issue (React Native 0.79+)
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '../../Utilities/Platform': path.resolve(__dirname, 'node_modules/react-native/Libraries/Utilities/Platform.android.js'),
};

module.exports = config;
