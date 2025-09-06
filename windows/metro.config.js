const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    alias: {
      '@components': './src/components',
      '@screens': './src/screens',
      '@hooks': './src/hooks',
      '@services': './src/services',
      '@database': './src/database',
      '@utils': './src/utils',
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);