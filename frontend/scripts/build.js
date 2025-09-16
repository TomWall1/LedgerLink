#!/usr/bin/env node

/**
 * Custom build script to handle dependency resolution issues
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

function fixDependencies() {
  console.log('🔧 Fixing dependency conflicts...');
  
  // Install specific versions to resolve conflicts
  const fixCommands = [
    'npm install ajv@^8.12.0 --save-dev',
    'npm install ajv-keywords@^5.1.0 --save-dev',
  ];
  
  fixCommands.forEach(cmd => {
    try {
      runCommand(cmd);
    } catch (error) {
      console.warn(`Warning: ${cmd} failed, continuing...`);
    }
  });
}

function buildApp() {
  console.log('🏗️  Building React application...');
  
  // Set environment variables for build
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.INLINE_RUNTIME_CHUNK = 'false';
  process.env.NODE_OPTIONS = '--max_old_space_size=4096';
  
  runCommand('react-scripts build');
}

function main() {
  console.log('🚀 Starting LedgerLink frontend build...');
  
  try {
    // Fix dependencies first
    fixDependencies();
    
    // Then build
    buildApp();
    
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixDependencies, buildApp };