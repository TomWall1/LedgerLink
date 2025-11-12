import { XeroClient } from 'xero-node';
import { tokenStore } from '../utils/tokenStore.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Xero Service Module
 * 
 * This module provides reusable functions for interacting with the Xero API.
 * It's designed to be used by multiple routes without making internal HTTP calls.
 */

/**
 * Create a configured Xero client instance
 * @returns {XeroClient} Configured Xero client
 */
export const getXeroClient = () => {
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET,
    redirectUris: [process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/api/xero/callback'],
    scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read', 'accounting.settings.read'],
    httpTimeout: 30000
  });
};

/**
 * Make a direct API call to Xero
 * This is more reliable than using the SDK for some operations
 * 
 * @param {string} url - The Xero API endpoint URL
 * @param {string} accessToken - Valid Xero access token
 * @param {string} tenantId - Xero tenant ID
 * @returns {Promise<Object>} API response data
 */
async function callXeroApi(url, accessToken, tenantId) {
  try {
    console.log('   [XeroService] Making direct API call to:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Xero-tenant-id': tenantId,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    console.log(`   [XeroService] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error('   [XeroService] API call failed:', {
        status: response.status,
        text: text.substring(0, 500)
      });
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('   [XeroService] Failed to parse response:', text.substring(0, 500));
      throw new Error('Invalid JSON response from Xero');
    }
  } catch (error) {
    console.error('   [XeroService] Error in callXeroApi:', error);
    throw error;
  }
}

/**
 * Fetch all active contacts from Xero
 * This includes both customers and suppliers
 * 
 * @returns {Promise<Array>} Array of Xero contacts with formatting
 * @throws {Error} If not authenticated or no tenants found
 */
export const fetchXeroContacts = async () => {
  try {
    console.log('[XeroService] Fetching all contacts from Xero...');
    
    // Get valid tokens
    const tokens = await tokenStore.getValidTokens();
    console.log('   [XeroService] Tokens retrieved:', !!tokens);
    
    if (!tokens) {
      console.log('   [XeroService] ❌ No valid tokens found');
      throw new Error('Not authenticated with Xero');
    }
    
    // Create Xero client to get tenants
    const xero = getXeroClient();
    xero.setTokenSet(tokens);
    console.log('   [XeroService] Xero client created and tokens set');
    
    // Get available tenant connections
    const tenants = await xero.updateTenants();
    console.log('   [XeroService] Tenants found:', tenants ? tenants.length : 0);
    
    if (!tenants || tenants.length === 0) {
      console.log('   [XeroService] ❌ No Xero organizations found');
      throw new Error('No Xero organizations found for this connection');
    }
    
    // Use the first tenant ID (most common scenario)
    const firstTenant = tenants[0];
    console.log('   [XeroService] Using tenant:', firstTenant.tenantName, firstTenant.tenantId);
    
    // Fetch ALL contacts - Xero will include IsCustomer and IsSupplier flags
    console.log('   [XeroService] Calling Xero API to fetch all active contacts...');
    const contactsData = await callXeroApi(
      'https://api.xero.com/api.xro/2.0/Contacts?where=ContactStatus=="ACTIVE"',
      tokens.access_token,
      firstTenant.tenantId
    );
    
    console.log('   [XeroService] Response received');
    const contacts = contactsData.Contacts || [];
    console.log('   [XeroService] ✅ Total active contacts found:', contacts.length);
    
    // Format contacts with type information
    const formattedContacts = contacts.map(contact => ({
      contactID: contact.ContactID,
      name: contact.Name || '',
      emailAddress: contact.EmailAddress || '',
      isCustomer: contact.IsCustomer || false,
      isSupplier: contact.IsSupplier || false,
      contactNumber: contact.ContactNumber || '',
      accountNumber: contact.AccountNumber || '',
      taxNumber: contact.TaxNumber || '',
      contactStatus: contact.ContactStatus,
      addresses: contact.Addresses || [],
      phones: contact.Phones || [],
      bankAccountDetails: contact.BankAccountDetails || ''
    }));
    
    // Log summary
    const customers = formattedContacts.filter(c => c.isCustomer);
    const suppliers = formattedContacts.filter(c => c.isSupplier);
    const both = formattedContacts.filter(c => c.isCustomer && c.isSupplier);
    
    console.log(`   [XeroService] 📊 Summary: ${customers.length} customers, ${suppliers.length} vendors, ${both.length} both`);
    
    return formattedContacts;
  } catch (error) {
    console.error('[XeroService] ❌ Error fetching Xero contacts:', error);
    throw error;
  }
};

/**
 * Get valid Xero tokens (with automatic refresh if needed)
 * @returns {Promise<Object|null>} Token set or null if not authenticated
 */
export const getValidTokens = async () => {
  try {
    return await tokenStore.getValidTokens();
  } catch (error) {
    console.error('[XeroService] Error getting valid tokens:', error);
    return null;
  }
};
