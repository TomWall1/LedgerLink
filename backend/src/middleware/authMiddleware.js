// This is an alias file to maintain compatibility with imports
// Import and re-export the auth functions from auth.js
import { protect, admin } from './auth.js';

export { protect, admin };
