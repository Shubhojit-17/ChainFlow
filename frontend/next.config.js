const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Fix for MetaMask SDK - alias react-native-async-storage to a browser-compatible mock
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/lib/async-storage-mock.js'),
    };
    
    return config;
  },
};

module.exports = nextConfig;
