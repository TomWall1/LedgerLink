const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Resolve ajv dependency conflicts
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'ajv': path.resolve(__dirname, 'node_modules/ajv'),
      };
      
      // Optimize build for production
      if (env === 'production') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
            },
          },
        };
        
        // Disable source maps for smaller build size
        webpackConfig.devtool = false;
      }
      
      return webpackConfig;
    },
  },
};