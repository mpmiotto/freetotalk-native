// Metro configuration for React Native with Expo
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the default Metro config
const defaultConfig = getDefaultConfig(__dirname);

// Add the new directory values (assetExts, sourceExts) to the defaults
defaultConfig.resolver.assetExts.push('db', 'sqlite');
defaultConfig.resolver.sourceExts = [
  'js', 'jsx', 'ts', 'tsx', 'json', 'mjs', 'cjs'
];

// Set up the extraNodeModules for path mapping
defaultConfig.resolver.extraNodeModules = {
  '@': path.resolve(__dirname),
  '@assets': path.resolve(__dirname, 'assets'),
};

module.exports = defaultConfig;