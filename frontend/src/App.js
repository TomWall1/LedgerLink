import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Simple components defined inline to avoid import issues
const Home = () => {
  return (
    <div style={{ padding: '40px', textAlign: 'center', minHeight: '80vh' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 20px',
        borderRadius: '12px',
        marginBottom: '40px'
      }}>
        <h1 style={{ fontSize: '3em', marginBottom: '20px', fontWeight: '700' }}>
          🔗 LedgerLink
        </h1>
        <p style={{ fontSize: '1.3em', maxWidth: '600px', margin: '0 auto 30px' }}>
          Automated financial reconciliation platform for Coupa-NetSuite integration.
          Intelligent matching algorithms with 95%+ accuracy.
        </p>
        <a 
          href="/coupa-netsuite"
          style={{
            display: 'inline-block',
            padding: '15px 30px',
            background: 'white',
            color: '#667eea',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1.1em',
            boxShadow: '0 4px 15px rgba(255,255,255,0.3)'
          }}
        >
          📊 Start Reconciliation
        </a>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#1e293b', marginBottom: '15px' }}>⚡ Lightning Fast</h3>
          <p style={{ color: '#64748b' }}>Process thousands of records in seconds with optimized algorithms.</p>
        </div>
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#1e293b', marginBottom: '15px' }}>🎯 Intelligent Matching</h3>
          <p style={{ color: '#64748b' }}>Advanced fuzzy matching handles data inconsistencies automatically.</p>
        </div>
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#1e293b', marginBottom: '15px' }}>🛡️ Audit Ready</h3>
          <p style={{ color: '#64748b' }}>Comprehensive reporting with detailed audit trails.</p>
        </div>
      </div>
    </div>
  );
};

const About = () => {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 20px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{ fontSize: '2.5em', marginBottom: '20px' }}>About LedgerLink</h1>
        <p style={{ fontSize: '1.2em', opacity: '0.9' }}>
          Revolutionizing financial reconciliation through intelligent automation.
        </p>
      </div>
      
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>Our Mission</h2>
        <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>
          LedgerLink was built to solve one of the most time-consuming challenges in finance: 
          manual reconciliation between different financial systems. We believe that advanced 
          automation and AI can free finance professionals to focus on strategic analysis 
          rather than data matching.
        </p>
        <p style={{ color: '#64748b', lineHeight: '1.6' }}>
          Our platform specifically addresses the complex task of reconciling Coupa invoice 
          approvals with NetSuite AR ledger data, providing unprecedented accuracy and 
          efficiency in the process.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '40px' }}>
          <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '2em', fontWeight: '700', color: '#667eea' }}>90%</div>
            <div style={{ color: '#64748b', fontWeight: '600' }}>Time Reduction</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '2em', fontWeight: '700', color: '#667eea' }}>95%</div>
            <div style={{ color: '#64748b', fontWeight: '600' }}>Match Accuracy</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '2em', fontWeight: '700', color: '#667eea' }}>100K+</div>
            <div style={{ color: '#64748b', fontWeight: '600' }}>Records Processed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navigation = () => {
  return (
    <nav style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '0 20px',
      boxShadow: '0 2px 20px rgba(102, 126, 234, 0.3)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '70px'
      }}>
        <a href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          color: 'white',
          fontWeight: '700',
          fontSize: '1.5em'
        }}>
          <span>🔗</span>
          <span>LedgerLink</span>
        </a>
        
        <div style={{ display: 'flex', gap: '30px' }}>
          <a href="/" style={{
            color: 'rgba(255,255,255,0.9)',
            textDecoration: 'none',
            fontWeight: '500',
            padding: '10px 16px',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}>🏠 Home</a>
          <a href="/coupa-netsuite" style={{
            color: 'rgba(255,255,255,0.9)',
            textDecoration: 'none',
            fontWeight: '500',
            padding: '10px 16px',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}>📊 Coupa-NetSuite</a>
          <a href="/about" style={{
            color: 'rgba(255,255,255,0.9)',
            textDecoration: 'none',
            fontWeight: '500',
            padding: '10px 16px',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}>ℹ️ About</a>
        </div>
      </div>
    </nav>
  );
};

// Import CoupaDashboard - this should exist
import CoupaDashboard from './components/CoupaDashboard';

function App() {
  return (
    <div className="App">
      <Router>
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/coupa-netsuite" element={<CoupaDashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;