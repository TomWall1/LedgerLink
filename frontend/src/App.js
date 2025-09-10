import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CoupaDashboard from './components/CoupaDashboard';

// Simple inline components to avoid any import issues
function HomePage() {
  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 20px',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto 40px'
      }}>
        <h1 style={{ fontSize: '3em', margin: '0 0 20px 0', fontWeight: '700' }}>
          🔗 LedgerLink
        </h1>
        <p style={{ fontSize: '1.3em', margin: '0 0 30px 0', lineHeight: '1.6' }}>
          Automated financial reconciliation for Coupa-NetSuite integration
        </p>
        <a href="/coupa-netsuite" style={{
          display: 'inline-block',
          padding: '15px 30px',
          background: 'white',
          color: '#667eea',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: '600'
        }}>
          📊 Start Reconciliation
        </a>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#1e293b', margin: '0 0 15px 0' }}>⚡ Lightning Fast</h3>
          <p style={{ color: '#64748b', margin: '0' }}>Process thousands of records in seconds</p>
        </div>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#1e293b', margin: '0 0 15px 0' }}>🎯 Smart Matching</h3>
          <p style={{ color: '#64748b', margin: '0' }}>95%+ accuracy with AI algorithms</p>
        </div>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#1e293b', margin: '0 0 15px 0' }}>🛡️ Audit Ready</h3>
          <p style={{ color: '#64748b', margin: '0' }}>Comprehensive reporting</p>
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 20px',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto 40px'
      }}>
        <h1 style={{ fontSize: '2.5em', margin: '0 0 20px 0' }}>About LedgerLink</h1>
        <p style={{ fontSize: '1.2em', margin: '0' }}>Financial reconciliation made simple</p>
      </div>
      
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2 style={{ color: '#1e293b', margin: '0 0 20px 0' }}>Our Mission</h2>
        <p style={{ color: '#64748b', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          LedgerLink automates the reconciliation between Coupa invoice approvals 
          and NetSuite AR ledger data, saving finance teams 90% of their time.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '30px' }}>
          <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '2em', fontWeight: '700', color: '#667eea' }}>90%</div>
            <div style={{ color: '#64748b', fontSize: '0.9em' }}>Time Saved</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '2em', fontWeight: '700', color: '#667eea' }}>95%</div>
            <div style={{ color: '#64748b', fontSize: '0.9em' }}>Accuracy</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '2em', fontWeight: '700', color: '#667eea' }}>100K+</div>
            <div style={{ color: '#64748b', fontSize: '0.9em' }}>Records</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBar() {
  return (
    <nav style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '15px 20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <a href="/" style={{
          color: 'white',
          textDecoration: 'none',
          fontSize: '1.5em',
          fontWeight: '700'
        }}>
          🔗 LedgerLink
        </a>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="/" style={{
            color: 'white',
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.95em'
          }}>🏠 Home</a>
          <a href="/coupa-netsuite" style={{
            color: 'white',
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.95em'
          }}>📊 Dashboard</a>
          <a href="/about" style={{
            color: 'white',
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.95em'
          }}>ℹ️ About</a>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/coupa-netsuite" element={<CoupaDashboard />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}