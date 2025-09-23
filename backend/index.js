#!/usr/bin/env node

/**
 * LedgerLink Backend Entry Point
 * 
 * This file exists as a workaround for deployment platforms that 
 * hardcode 'node index.js' as the start command. It simply launches
 * the main server.js file.
 */

console.log('🔄 Starting LedgerLink Backend...');
console.log('📝 Note: This is a deployment workaround - main server is in server.js');

// Launch the actual server
require('./server.js');