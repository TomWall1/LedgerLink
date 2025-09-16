#!/usr/bin/env node

/**
 * Simplified build script that avoids dependency conflicts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, options = {}) {
  try {
    console.log(`Running: ${command}`);
    return execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options 
    });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    throw error;
  }
}

function buildApp() {
  console.log('🏗️  Building LedgerLink frontend...');
  
  // Set build environment variables
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.INLINE_RUNTIME_CHUNK = 'false';
  process.env.NODE_OPTIONS = '--max_old_space_size=4096';
  process.env.DISABLE_ESLINT_PLUGIN = 'true';
  process.env.TSC_COMPILE_ON_ERROR = 'true';
  process.env.ESLINT_NO_DEV_ERRORS = 'true';
  
  // Use craco build which handles webpack config properly
  runCommand('npx craco build');
}

function main() {
  console.log('🚀 Starting LedgerLink frontend build...');
  
  try {
    buildApp();
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    
    // Fallback to direct react-scripts build
    console.log('🔄 Trying fallback build method...');
    try {
      runCommand('npx react-scripts build');
      console.log('✅ Fallback build completed successfully!');
    } catch (fallbackError) {
      console.error('❌ Fallback build also failed:', fallbackError.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildApp };