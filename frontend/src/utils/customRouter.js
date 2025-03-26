// Custom router implementation to avoid React Router issues

// Track the current route
export const getCurrentRoute = () => {
  const path = window.location.pathname;
  return path === '/' ? 'dashboard' : path.substring(1);
};

// Navigate to a new route
export const navigateTo = (route) => {
  const newPath = route === 'dashboard' ? '/' : `/${route}`;
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
  
  // Handle specific path patterns
  if (path.startsWith('/erp-data/') && segments.length >= 3) {
    if (paramName === 'connectionId') {
      return segments[2];
    }
  }
  
  return null;
};
