const { XeroClient } = require('xero-node');

// Get Xero client with token
const getXeroClient = (req) => {
  const tokenSet = req.session.xeroTokenSet;
  
  if (!tokenSet) {
    throw new Error('No Xero token found in session');
  }
  
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET,
    redirectUris: [`${process.env.API_URL || 'https://ledgerlink.onrender.com'}/api/xero/callback`],
    scopes: ['accounting.contacts.read', 'accounting.transactions.read'],
    state: 'returnPage=main',
    httpTimeout: 3000
  }, tokenSet);
};

module.exports = {
  getXeroClient
};