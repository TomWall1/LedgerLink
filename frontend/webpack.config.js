const path = require('path');
const webpack = require('webpack');

// Webpack configuration override for dependency issues
module.exports = function override(config, env) {
  // Ignore problematic ajv modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "ajv": false,
    "ajv-keywords": false,
  };
  
  // Add null-loader for problematic modules
  config.module.rules.push({
    test: /ajv-keywords/,
    use: 'null-loader'
  });
  
  // Disable source maps in production
  if (env === 'production') {
    config.devtool = false;
  }
  
  return config;
};