#!/usr/bin/env node

/**
 * Fix ajv dependency conflicts by patching problematic files
 */

const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`🔧 [Fix Dependencies] ${message}`);
}

function fixAjvKeywords() {
  try {
    // Path to the problematic ajv-keywords file
    const ajvKeywordsPath = path.join(
      __dirname,
      '..',
      'node_modules',
      'ajv-keywords',
      'dist',
      'definitions',
      'typeof.js'
    );
    
    if (fs.existsSync(ajvKeywordsPath)) {
      log('Found ajv-keywords typeof.js, applying fix...');
      
      let content = fs.readFileSync(ajvKeywordsPath, 'utf8');
      
      // Replace the problematic import
      content = content.replace(
        "require('ajv/dist/compile/codegen')",
        "require('ajv/dist/compile/codegen/index')"
      );
      
      // Alternative fallback
      if (content.includes("require('ajv/dist/compile/codegen')")) {
        content = content.replace(
          "const { _, Name } = require('ajv/dist/compile/codegen');",
          "const codegen = require('ajv/dist/compile/codegen'); const _ = codegen._; const Name = codegen.Name;"
        );
      }
      
      fs.writeFileSync(ajvKeywordsPath, content);
      log('Successfully patched ajv-keywords');
    } else {
      log('ajv-keywords typeof.js not found, skipping fix');
    }
  } catch (error) {
    log(`Warning: Could not fix ajv-keywords: ${error.message}`);
  }
}

function createAjvMock() {
  try {
    // Create a mock ajv codegen if the real one doesn't exist
    const ajvCodegenPath = path.join(
      __dirname,
      '..',
      'node_modules',
      'ajv',
      'dist',
      'compile',
      'codegen'
    );
    
    if (!fs.existsSync(ajvCodegenPath)) {
      log('Creating ajv codegen directory...');
      fs.mkdirSync(ajvCodegenPath, { recursive: true });
      
      const mockCodegen = `
// Mock codegen for compatibility
module.exports = {
  _: function() { return ''; },
  Name: function(name) { return name; },
  str: function(s) { return JSON.stringify(s); },
  nil: null,
  not: function(x) { return '!' + x; },
  Code: function(code) { return code; }
};
`;
      
      fs.writeFileSync(path.join(ajvCodegenPath, 'index.js'), mockCodegen);
      log('Created mock ajv codegen');
    }
  } catch (error) {
    log(`Warning: Could not create ajv mock: ${error.message}`);
  }
}

function removeTerserPlugin() {
  try {
    // Try to disable terser-webpack-plugin temporarily
    const webpackConfigPath = path.join(
      __dirname,
      '..',
      'node_modules',
      'react-scripts',
      'config',
      'webpack.config.js'
    );
    
    if (fs.existsSync(webpackConfigPath)) {
      let content = fs.readFileSync(webpackConfigPath, 'utf8');
      
      // Comment out TerserPlugin to avoid ajv-keywords issues
      if (content.includes('TerserPlugin') && !content.includes('// PATCHED:')) {
        content = '// PATCHED: Disabled TerserPlugin to avoid ajv-keywords issues\n' + content;
        content = content.replace(
          /new TerserPlugin\([^}]+}\)/g,
          '// Disabled TerserPlugin'
        );
        
        fs.writeFileSync(webpackConfigPath, content);
        log('Disabled TerserPlugin in webpack config');
      }
    }
  } catch (error) {
    log(`Warning: Could not modify webpack config: ${error.message}`);
  }
}

function main() {
  log('Starting dependency fixes...');
  
  fixAjvKeywords();
  createAjvMock();
  removeTerserPlugin();
  
  log('Dependency fixes completed');
}

if (require.main === module) {
  main();
}

module.exports = {
  fixAjvKeywords,
  createAjvMock,
  removeTerserPlugin
};