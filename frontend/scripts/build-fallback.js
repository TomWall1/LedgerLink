#!/usr/bin/env node

/**
 * Fallback build script that creates a working static site
 */

const fs = require('fs');
const path = require('path');

function createBuildDirectory() {
  const buildDir = path.join(process.cwd(), 'build');
  
  // Ensure build directory exists
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  return buildDir;
}

function createIndexHtml(buildDir) {
  const indexPath = path.join(buildDir, 'index.html');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <meta name="description" content="LedgerLink - Streamline your ledger reconciliation with automated matching and Xero integration" />
  <title>LedgerLink</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 16px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.15);
      text-align: center;
      max-width: 600px;
      width: 100%;
    }
    .logo {
      font-size: 3rem;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 1rem;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .subtitle {
      color: #6b7280;
      margin-bottom: 2rem;
      font-size: 1.2rem;
      font-weight: 400;
    }
    .status {
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }
    .status h3 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }
    .btn {
      background: #4f46e5;
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #4338ca;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn.secondary {
      background: #6b7280;
    }
    .btn.secondary:hover {
      background: #374151;
    }
    .steps {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: left;
    }
    .steps h4 {
      color: #374151;
      margin-bottom: 1rem;
      text-align: center;
    }
    .steps ol {
      list-style: none;
      counter-reset: step-counter;
    }
    .steps li {
      counter-increment: step-counter;
      margin-bottom: 0.75rem;
      padding-left: 2rem;
      position: relative;
    }
    .steps li::before {
      content: counter(step-counter);
      position: absolute;
      left: 0;
      top: 0;
      background: #4f46e5;
      color: white;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: bold;
    }
    .health-status {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
    }
    .health-loading {
      background: #fef3c7;
      color: #92400e;
    }
    .health-success {
      background: #d1fae5;
      color: #065f46;
    }
    .health-error {
      background: #fee2e2;
      color: #991b1b;
    }
    @media (max-width: 768px) {
      .container { padding: 2rem; }
      .logo { font-size: 2.5rem; }
      .actions { flex-direction: column; }
      .btn { justify-content: center; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🔗 LedgerLink</div>
    <div class="subtitle">Streamline your ledger reconciliation with automated matching and Xero integration</div>
    
    <div class="status">
      <h3>🚀 Platform Deployed Successfully!</h3>
      <p>Your LedgerLink instance is live and ready for configuration.</p>
    </div>
    
    <div class="actions">
      <a href="https://ledgerlink.onrender.com/health" class="btn" target="_blank">
        ⚡ Check API Health
      </a>
      <a href="https://github.com/TomWall1/LedgerLink" class="btn secondary" target="_blank">
        📚 View Documentation
      </a>
    </div>
    
    <div class="steps">
      <h4>🎯 Next Steps to Complete Setup</h4>
      <ol>
        <li><strong>Configure Xero OAuth:</strong> Set up your Xero developer app and add credentials to backend environment</li>
        <li><strong>Database Setup:</strong> Connect your MongoDB instance for data persistence</li>
        <li><strong>Environment Variables:</strong> Configure JWT secrets and encryption keys</li>
        <li><strong>Test Integration:</strong> Connect your first Xero organization and sync data</li>
        <li><strong>Start Reconciling:</strong> Upload CSV files and begin automated matching!</li>
      </ol>
    </div>
    
    <div id="health-status" class="health-status health-loading">
      🔄 Checking backend API status...
    </div>
  </div>
  
  <script>
    // Backend health check
    const healthStatus = document.getElementById('health-status');
    
    async function checkHealth() {
      try {
        const response = await fetch('https://ledgerlink.onrender.com/health', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          healthStatus.className = 'health-status health-success';
          healthStatus.innerHTML = '✅ Backend API is healthy and running!';
        } else {
          throw new Error('API returned ' + response.status);
        }
      } catch (error) {
        healthStatus.className = 'health-status health-error';
        healthStatus.innerHTML = '⚠️ Backend API is starting up... This may take a few minutes on first deploy.';
        
        // Retry after 30 seconds
        setTimeout(checkHealth, 30000);
      }
    }
    
    // Initial check
    setTimeout(checkHealth, 1000);
    
    // Analytics and error tracking
    window.addEventListener('error', function(e) {
      console.log('Page error:', e.error);
    });
    
    console.log('🔗 LedgerLink deployed successfully!');
    console.log('📚 Documentation: https://github.com/TomWall1/LedgerLink');
  </script>
</body>
</html>`;

  fs.writeFileSync(indexPath, html);
  console.log('✅ Created index.html');
}

function copyStaticAssets(buildDir) {
  // Copy favicon and other assets if they exist
  const publicDir = path.join(process.cwd(), 'public');
  
  if (fs.existsSync(publicDir)) {
    const assets = ['favicon.ico', 'logo192.png', 'logo512.png', 'manifest.json', 'robots.txt'];
    
    assets.forEach(asset => {
      const srcPath = path.join(publicDir, asset);
      const destPath = path.join(buildDir, asset);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied ${asset}`);
      }
    });
  }
}

function main() {
  console.log('🚀 Creating LedgerLink static deployment...');
  
  const buildDir = createBuildDirectory();
  createIndexHtml(buildDir);
  copyStaticAssets(buildDir);
  
  console.log('✅ Static deployment created successfully!');
  console.log('📁 Build output:', buildDir);
}

if (require.main === module) {
  main();
}

module.exports = { main };