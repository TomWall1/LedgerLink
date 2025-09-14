// Cleanup script to remove conflicting JS files
const fs = require('fs');
const path = require('path');

function removeJSFiles(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      removeJSFiles(fullPath);
    } else if (file.endsWith('.js') && !file.includes('.test.') && !file.includes('.spec.')) {
      console.log('Removing conflicting file:', fullPath);
      fs.unlinkSync(fullPath);
    }
  }
}

// Remove JS files from src directory
removeJSFiles(path.join(__dirname, 'frontend', 'src'));
console.log('Cleanup completed');