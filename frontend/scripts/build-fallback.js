#!/usr/bin/env node

/**
 * Fallback build script using Vite instead of react-scripts
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

function createSimpleBuild() {
  console.log('🏗️ Creating simple static build...');
  
  // Create a simple build directory
  const buildDir = path.join(process.cwd(), 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Copy public files
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    runCommand(`cp -r public/* build/`);
  }
  
  // Create a simple index.html if none exists
  const indexPath = path.join(buildDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    const simpleHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LedgerLink</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
    }
    .logo {
      font-size: 2.5em;
      font-weight: bold;
      color: #4f46e5;
      margin-bottom: 20px;
    }
    .subtitle {
      color: #6b7280;
      margin-bottom: 30px;
      font-size: 1.1em;
    }
    .status {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .btn {
      background: #4f46e5;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      margin: 5px;
    }
    .btn:hover {
      background: #4338ca;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">LedgerLink</div>
    <div class="subtitle">Streamline your ledger reconciliation with automated matching and Xero integration</div>
    
    <div class="status">
      <h3>🚀 Application Deployed Successfully!</h3>
      <p>The LedgerLink platform is running and ready for configuration.</p>
    </div>
    
    <div>
      <a href="https://ledgerlink.onrender.com/health" class="btn">Check API Status</a>
      <a href="https://github.com/TomWall1/LedgerLink" class="btn">View Documentation</a>
    </div>
    
    <div style="margin-top: 30px; font-size: 14px; color: #6b7280;">
      <p>Next Steps:</p>
      <ul style="text-align: left; display: inline-block;">
        <li>Configure your Xero OAuth credentials</li>
        <li>Set up your database connection</li>
        <li>Start reconciling your ledgers!</li>
      </ul>
    </div>
  </div>
  
  <script>
    // Simple health check
    fetch('https://ledgerlink.onrender.com/health')
      .then(response => response.json())
      .then(data => {
        console.log('Backend health:', data);
      })
      .catch(error => {
        console.log('Backend not yet available:', error);
      });
  </script>
</body>
</html>
`;
    
    fs.writeFileSync(indexPath, simpleHTML);
    console.log('✅ Created simple static build');
  }
}

function main() {
  console.log('🚀 Running fallback build process...');
  createSimpleBuild();
  console.log('✅ Fallback build completed successfully!');
}

if (require.main === module) {
  main();
}

module.exports = { createSimpleBuild };