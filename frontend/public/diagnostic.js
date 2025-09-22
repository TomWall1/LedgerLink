/**
 * LedgerLink Diagnostic Utility
 * Comprehensive debugging tool to track redirects, errors, and navigation issues
 */

// Global diagnostic state
window.LEDGERLINK_DIAGNOSTICS = {
  initialized: false,
  events: [],
  startTime: Date.now(),
  redirectAttempts: [],
  errors: [],
  navigationEvents: []
};

/**
 * Log diagnostic event
 */
function logDiagnostic(type, message, data = null) {
  const event = {
    timestamp: Date.now(),
    type,
    message,
    data,
    stackTrace: type === 'error' ? new Error().stack : null
  };
  
  window.LEDGERLINK_DIAGNOSTICS.events.push(event);
  
  const emoji = {
    'init': '🚀',
    'redirect': '🚨',
    'navigation': '🔍',
    'error': '❌',
    'auth': '🔐',
    'api': '📡',
    'component': '⚛️'
  }[type] || '📝';
  
  console.log(`${emoji} DIAGNOSTIC [${type.toUpperCase()}]:`, message, data || '');
  
  // Store specific event types
  if (type === 'redirect') {
    window.LEDGERLINK_DIAGNOSTICS.redirectAttempts.push(event);
  } else if (type === 'error') {
    window.LEDGERLINK_DIAGNOSTICS.errors.push(event);
  } else if (type === 'navigation') {
    window.LEDGERLINK_DIAGNOSTICS.navigationEvents.push(event);
  }
}

/**
 * Check if we're in development mode
 */
function isDevelopmentMode() {
  // Check various indicators for development mode
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '3000' ||
    window.location.search.includes('debug=true') ||
    window.location.search.includes('diagnostic=true')
  );
}

/**
 * Initialize diagnostics immediately when script loads
 */
function initializeDiagnostics() {
  if (window.LEDGERLINK_DIAGNOSTICS.initialized) return;
  
  logDiagnostic('init', 'Diagnostic system initializing...');
  
  // 1. Monitor all window.location changes
  const originalLocation = window.location;
  
  // Override href setter
  let hrefDescriptor = Object.getOwnPropertyDescriptor(Location.prototype, 'href');
  if (hrefDescriptor && hrefDescriptor.set) {
    const originalHrefSetter = hrefDescriptor.set;
    Object.defineProperty(Location.prototype, 'href', {
      ...hrefDescriptor,
      set: function(url) {
        logDiagnostic('redirect', `window.location.href set to: ${url}`, {
          from: window.location.href,
          to: url,
          stackTrace: new Error().stack
        });
        return originalHrefSetter.call(this, url);
      }
    });
  }
  
  // Override assign and replace
  const originalAssign = window.location.assign;
  const originalReplace = window.location.replace;
  
  window.location.assign = function(url) {
    logDiagnostic('redirect', `window.location.assign called with: ${url}`, {
      from: window.location.href,
      to: url,
      stackTrace: new Error().stack
    });
    return originalAssign.call(this, url);
  };
  
  window.location.replace = function(url) {
    logDiagnostic('redirect', `window.location.replace called with: ${url}`, {
      from: window.location.href,
      to: url,
      stackTrace: new Error().stack
    });
    return originalReplace.call(this, url);
  };
  
  // 2. Monitor History API
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(state, title, url) {
    logDiagnostic('navigation', `history.pushState called`, {
      state,
      title,
      url,
      currentUrl: window.location.href,
      stackTrace: new Error().stack
    });
    return originalPushState.call(this, state, title, url);
  };
  
  history.replaceState = function(state, title, url) {
    logDiagnostic('navigation', `history.replaceState called`, {
      state,
      title,
      url,
      currentUrl: window.location.href,
      stackTrace: new Error().stack
    });
    return originalReplaceState.call(this, state, title, url);
  };
  
  // 3. Monitor popstate events
  window.addEventListener('popstate', function(event) {
    logDiagnostic('navigation', 'popstate event triggered', {
      state: event.state,
      url: window.location.href
    });
  });
  
  // 4. Global error handler
  window.addEventListener('error', function(event) {
    logDiagnostic('error', `Global error: ${event.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.toString(),
      stack: event.error?.stack
    });
  });
  
  // 5. Unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    logDiagnostic('error', `Unhandled promise rejection: ${event.reason}`, {
      reason: event.reason,
      promise: event.promise
    });
  });
  
  // 6. Monitor fetch requests that might cause redirects
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    logDiagnostic('api', `fetch request to: ${url}`, { options });
    
    return originalFetch.apply(this, args).then(response => {
      if (response.redirected) {
        logDiagnostic('redirect', `HTTP redirect detected`, {
          originalUrl: url,
          finalUrl: response.url,
          status: response.status
        });
      }
      return response;
    }).catch(error => {
      logDiagnostic('error', `fetch error for ${url}`, { error: error.toString() });
      throw error;
    });
  };
  
  // 7. Monitor DOM mutations for any added redirects
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for meta refresh redirects
            if (node.tagName === 'META' && node.getAttribute('http-equiv') === 'refresh') {
              logDiagnostic('redirect', 'Meta refresh redirect detected', {
                content: node.getAttribute('content')
              });
            }
            // Check for any scripts that might cause redirects
            if (node.tagName === 'SCRIPT' && node.innerHTML.includes('location')) {
              logDiagnostic('redirect', 'Script with location detected', {
                innerHTML: node.innerHTML.substring(0, 200)
              });
            }
          }
        });
      }
    });
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  // 8. Log initial URL
  logDiagnostic('init', 'Initial URL', {
    href: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  });
  
  window.LEDGERLINK_DIAGNOSTICS.initialized = true;
  logDiagnostic('init', 'Diagnostic system initialized successfully');
}

/**
 * Create diagnostic panel
 */
function createDiagnosticPanel() {
  // Only create in development mode or when explicitly enabled
  if (!isDevelopmentMode()) {
    return;
  }
  
  const panel = document.createElement('div');
  panel.id = 'ledgerlink-diagnostic-panel';
  panel.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    height: 400px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    overflow-y: auto;
    z-index: 999999;
    border-left: 2px solid #ff6b6b;
    display: none;
  `;
  
  function updatePanel() {
    const diagnostics = window.LEDGERLINK_DIAGNOSTICS;
    const recentEvents = diagnostics.events.slice(-20);
    
    panel.innerHTML = `
      <div style="font-weight: bold; color: #ff6b6b; margin-bottom: 10px;">
        🔍 LedgerLink Diagnostics
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Current URL:</strong> ${window.location.pathname}<br>
        <strong>Redirects:</strong> ${diagnostics.redirectAttempts.length}<br>
        <strong>Errors:</strong> ${diagnostics.errors.length}<br>
        <strong>Events:</strong> ${diagnostics.events.length}
      </div>
      <div style="border-top: 1px solid #333; padding-top: 10px;">
        <strong>Recent Events:</strong>
        ${recentEvents.map(event => `
          <div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1);">
            <span style="color: #61dafb;">[${event.type}]</span> ${event.message}
            ${event.data ? `<br><span style="color: #ffa726; font-size: 10px;">${JSON.stringify(event.data).substring(0, 100)}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // Toggle panel with Ctrl+Shift+D
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      if (panel.style.display === 'block') {
        updatePanel();
      }
    }
  });
  
  // Update panel every 2 seconds when visible
  setInterval(() => {
    if (panel.style.display === 'block') {
      updatePanel();
    }
  }, 2000);
  
  document.body.appendChild(panel);
  
  logDiagnostic('init', 'Diagnostic panel created. Press Ctrl+Shift+D to toggle.');
}

// Initialize immediately
initializeDiagnostics();

// Create panel when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createDiagnosticPanel);
} else {
  createDiagnosticPanel();
}

// Export for manual access
window.showDiagnostics = function() {
  console.table(window.LEDGERLINK_DIAGNOSTICS.events);
  console.log('Redirect attempts:', window.LEDGERLINK_DIAGNOSTICS.redirectAttempts);
  console.log('Errors:', window.LEDGERLINK_DIAGNOSTICS.errors);
};

logDiagnostic('init', 'Diagnostic utility loaded. Use window.showDiagnostics() for summary.');