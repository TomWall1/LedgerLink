import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import CoupaDashboard from './components/CoupaDashboard';

// Navigation Component
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

// Home Component
const Home = () => {
  return (
    <div style={{ padding: '40px', textAlign: 'center', minHeight: '80vh', background: '#f8fafc' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 20px',
        borderRadius: '12px',
        marginBottom: '40px',
        maxWidth: '1000px',
        margin: '0 auto 40px'
      }}>
        <h1 style={{ fontSize: '3em', marginBottom: '20px', fontWeight: '700', margin: '0 0 20px 0' }}>
          🔗 LedgerLink
        </h1>
        <p style={{ fontSize: '1.3em', maxWidth: '600px', margin: '0 auto 30px', lineHeight: '1.6' }}>
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
            boxShadow: '0 4px 15px rgba(255,255,255,0.3)',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          📊 Start Reconciliation
        </a>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '30px', 
        maxWidth: '1000px', 
        margin: '0 auto'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ color: '#1e293b', marginBottom: '15px', fontSize: '1.4em' }}>⚡ Lightning Fast</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6', margin: '0' }}>Process thousands of records in seconds with optimized algorithms.</p>
        </div>
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ color: '#1e293b', marginBottom: '15px', fontSize: '1.4em' }}>🎯 Intelligent Matching</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6', margin: '0' }}>Advanced fuzzy matching handles data inconsistencies automatically.</p>
        </div>
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ color: '#1e293b', marginBottom: '15px', fontSize: '1.4em' }}>🛡️ Audit Ready</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6', margin: '0' }}>Comprehensive reporting with detailed audit trails.</p>
        </div>
      </div>
      
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '60px 20px',
        borderRadius: '12px',
        marginTop: '60px',
        textAlign: 'center',
        maxWidth: '1000px',
        margin: '60px auto 0'
      }}>
        <h2 style={{ fontSize: '2.2em', marginBottom: '15px', margin: '0 0 15px 0' }}>Ready to Get Started?</h2>
        <p style={{ fontSize: '1.1em', marginBottom: '30px', opacity: '0.9', margin: '0 0 30px 0' }}>
          Join finance teams who have reduced reconciliation time by 90%
        </p>
        <a 
          href="/coupa-netsuite"
          style={{
            display: 'inline-block',
            padding: '15px 30px',
            background: '#22c55e',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1.1em',
            boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
          }}
        >
          🚀 Get Started Now
        </a>
      </div>
    </div>
  );
};

// About Component
const About = () => {
  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', background: '#f8fafc', minHeight: '80vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 20px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{ fontSize: '2.5em', marginBottom: '20px', margin: '0 0 20px 0' }}>About LedgerLink</h1>
        <p style={{ fontSize: '1.2em', opacity: '0.9', margin: '0' }}>
          Revolutionizing financial reconciliation through intelligent automation.
        </p>
      </div>
      
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ color: '#1e293b', marginBottom: '20px', fontSize: '2em' }}>Our Mission</h2>
        <p style={{ color: '#64748b', lineHeight: '1.7', marginBottom: '20px', fontSize: '1.1em' }}>
          LedgerLink was built to solve one of the most time-consuming challenges in finance: 
          manual reconciliation between different financial systems. We believe that advanced 
          automation and AI can free finance professionals to focus on strategic analysis 
          rather than data matching.
        </p>
        <p style={{ color: '#64748b', lineHeight: '1.7', marginBottom: '40px', fontSize: '1.1em' }}>
          Our platform specifically addresses the complex task of reconciling Coupa invoice 
          approvals with NetSuite AR ledger data, providing unprecedented accuracy and 
          efficiency in the process.
        </p>
        
        <h3 style={{ color: '#1e293b', marginBottom: '30px', fontSize: '1.6em', textAlign: 'center' }}>Key Statistics</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '40px'
        }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '25px', 
            background: '#f8fafc', 
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '2.5em', fontWeight: '700', color: '#667eea', margin: '0 0 8px 0' }}>90%</div>
            <div style={{ color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.9em', letterSpacing: '0.5px' }}>Time Reduction</div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            padding: '25px', 
            background: '#f8fafc', 
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '2.5em', fontWeight: '700', color: '#667eea', margin: '0 0 8px 0' }}>95%</div>
            <div style={{ color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.9em', letterSpacing: '0.5px' }}>Match Accuracy</div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            padding: '25px', 
            background: '#f8fafc', 
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '2.5em', fontWeight: '700', color: '#667eea', margin: '0 0 8px 0' }}>100K+</div>
            <div style={{ color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.9em', letterSpacing: '0.5px' }}>Records Processed</div>
          </div>
        </div>
        
        <h3 style={{ color: '#1e293b', marginBottom: '20px', fontSize: '1.6em' }}>How It Works</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
          <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#667eea', marginBottom: '10px' }}>1. Upload</div>
            <p style={{ color: '#64748b', margin: '0', lineHeight: '1.5' }}>Upload your Coupa and NetSuite data files via our secure interface.</p>
          </div>
          <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#667eea', marginBottom: '10px' }}>2. Match</div>
            <p style={{ color: '#64748b', margin: '0', lineHeight: '1.5' }}>Our AI algorithm intelligently matches records with confidence scoring.</p>
          </div>
          <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#667eea', marginBottom: '10px' }}>3. Export</div>
            <p style={{ color: '#64748b', margin: '0', lineHeight: '1.5' }}>Review results and export comprehensive reports for your audit trail.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

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