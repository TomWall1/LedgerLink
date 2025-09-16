const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Fix ajv dependency conflicts by ignoring problematic modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "ajv": false,
        "ajv-keywords": false
      };
      
      // Add module resolution aliases
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
      };
      
      // Ignore problematic modules during build
      webpackConfig.module.rules.push({
        test: /ajv-keywords/,
        use: 'null-loader'
      });
      
      // Optimize for production
      if (env === 'production') {
        // Disable source maps to reduce build size
        webpackConfig.devtool = false;
        
        // Optimize chunks
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            maxSize: 244000,
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
            },
          },
        };
        
        // Disable TypeScript checking for faster builds
        const forkTsCheckerPlugin = webpackConfig.plugins.find(
          plugin => plugin.constructor.name === 'ForkTsCheckerWebpackPlugin'
        );
        if (forkTsCheckerPlugin) {
          forkTsCheckerPlugin.options.typescript.enabled = false;
        }
      }
      
      return webpackConfig;
    },
  },
  jest: {
    configure: {
      moduleNameMapping: {
        '^ajv-keywords$': '<rootDir>/src/__mocks__/empty.js',
      },
    },
  },
};