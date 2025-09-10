import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Shield, Zap } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Automated Financial <span className="highlight">Reconciliation</span>
          </h1>
          <p className="hero-description">
            LedgerLink streamlines your financial reconciliation process with intelligent 
            matching algorithms and comprehensive reporting. Connect Coupa invoice approvals 
            with NetSuite AR ledger data seamlessly.
          </p>
          <div className="hero-actions">
            <Link to="/coupa-netsuite" className="cta-button primary">
              <BarChart3 size={20} />
              Start Reconciliation
            </Link>
            <Link to="/about" className="cta-button secondary">
              Learn More
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card">
            <BarChart3 size={48} className="card-icon" />
            <h3>Smart Matching</h3>
            <p>AI-powered algorithm matches invoices with 95%+ accuracy</p>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-header">
          <h2>Why Choose LedgerLink?</h2>
          <p>Transform your reconciliation process with cutting-edge automation</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Zap className="icon" />
            </div>
            <h3>Lightning Fast</h3>
            <p>Process thousands of records in seconds, not hours. Our optimized algorithms ensure rapid reconciliation.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <TrendingUp className="icon" />
            </div>
            <h3>Intelligent Matching</h3>
            <p>Advanced fuzzy matching identifies connections even with data inconsistencies and variations.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <Shield className="icon" />
            </div>
            <h3>Audit Ready</h3>
            <p>Comprehensive reporting and detailed audit trails ensure compliance and transparency.</p>
          </div>
        </div>
      </section>

      <section className="integrations">
        <div className="integrations-content">
          <h2>Seamless Integrations</h2>
          <p>Connect your existing financial systems effortlessly</p>
          
          <div className="integration-logos">
            <div className="integration-item">
              <div className="logo-placeholder coupa">
                <span>Coupa</span>
              </div>
              <p>Invoice Approvals</p>
            </div>
            
            <div className="connection-arrow">→</div>
            
            <div className="integration-item ledgerlink">
              <div className="logo-placeholder">
                <span>🔗 LedgerLink</span>
              </div>
              <p>Smart Reconciliation</p>
            </div>
            
            <div className="connection-arrow">→</div>
            
            <div className="integration-item">
              <div className="logo-placeholder netsuite">
                <span>NetSuite</span>
              </div>
              <p>AR Ledger Data</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Streamline Your Reconciliation?</h2>
          <p>Join finance teams who have reduced reconciliation time by 90%</p>
          <Link to="/coupa-netsuite" className="cta-button large">
            <BarChart3 size={24} />
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;