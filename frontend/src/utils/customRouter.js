// Custom router implementation to avoid React Router issues

// Parse the current route from the URL
export const getCurrentRoute = () => {
  const path = window.location.pathname;
  
  // Special case for home/dashboard
  if (path === '/') {
    return 'dashboard';
  }
  
  // Process potential dynamic routes
  if (path.startsWith('/erp-data/')) {
    return 'erp-data';
  }
  
  // Special case for Xero OAuth callback
  if (path.startsWith('/auth/xero/callback')) {
    return 'auth/xero/callback';
  }
  
  // Default case: just remove the leading slash
  return path.substring(1);
};

// Navigate to a new route
export const navigateTo = (route) => {
  let newPath;
  
  // Handle home/dashboard
  if (route === 'dashboard') {
    newPath = '/';
  } 
  // Handle dynamic routes with params
  else if (route.includes('/')) {
    newPath = `/${route}`;
  } 
  // Regular routes
  else {
    newPath = `/${route}`;
  }
  
  // Update browser history and URL
  window.history.pushState(null, '', newPath);
  
  // Dispatch a custom event so components can react to navigation
  window.dispatchEvent(new CustomEvent('locationchange', {
    detail: { path: newPath }
  }));
};

// Initialize route listener
export const initRouteListener = (callback) => {
  // Listen for our custom event
  const handler = () => callback(getCurrentRoute());
  window.addEventListener('locationchange', handler);
  
  // Also handle browser back/forward navigation
  window.addEventListener('popstate', () => {
    callback(getCurrentRoute());
  });
  
  // Return cleanup function
  return () => {
    window.removeEventListener('locationchange', handler);
    window.removeEventListener('popstate', () => {
      callback(getCurrentRoute());
    });
  };
};

// Extract parameters from URL
export const getRouteParam = (paramName) => {
  const path = window.location.pathname;
  const segments = path.split('/');
  
  // Handle different path patterns with parameters
  if (path.startsWith('/erp-data/') && segments.length >= 3) {
    if (paramName === 'connectionId') {
      return segments[2];
    }
  }
  
  // Extract any query parameters from URL
  if (window.location.search) {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has(paramName)) {
      return searchParams.get(paramName);
    }
  }
  
  return null;
};
