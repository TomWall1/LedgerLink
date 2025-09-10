import React from 'react';
import { Shield, Zap, TrendingUp, Users, Award, Globe } from 'lucide-react';
import './About.css';

const About = () => {
  return (
    <div className="about">
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About LedgerLink</h1>
          <p className="hero-subtitle">
            Revolutionizing financial reconciliation through intelligent automation 
            and cutting-edge technology.
          </p>
        </div>
      </section>

      <section className="mission">
        <div className="mission-content">
          <div className="mission-text">
            <h2>Our Mission</h2>
            <p>
              LedgerLink was built to solve one of the most time-consuming challenges 
              in finance: manual reconciliation between different financial systems. 
              We believe that advanced automation and AI can free finance professionals 
              to focus on strategic analysis rather than data matching.
            </p>
            <p>
              Our platform specifically addresses the complex task of reconciling 
              Coupa invoice approvals with NetSuite AR ledger data, providing 
              unprecedented accuracy and efficiency in the process.
            </p>
          </div>
          <div className="mission-stats">
            <div className="stat">
              <div className="stat-number">90%</div>
              <div className="stat-label">Time Reduction</div>
            </div>
            <div className="stat">
              <div className="stat-number">95%</div>
              <div className="stat-label">Match Accuracy</div>
            </div>
            <div className="stat">
              <div className="stat-number">100K+</div>
              <div className="stat-label">Records Processed</div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="how-it-works-content">
          <h2>How LedgerLink Works</h2>
          <div className="process-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Data Upload</h3>
                <p>Upload your Coupa invoice approvals and NetSuite AR ledger data via CSV or Excel files.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Intelligent Matching</h3>
                <p>Our AI algorithm analyzes invoice numbers, amounts, vendors, and dates to find the best matches.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Review & Export</h3>
                <p>Review matched and unmatched records, analyze variances, and export comprehensive reports.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="technology">
        <div className="technology-content">
          <h2>Advanced Technology</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <Zap className="tech-icon" />
              <h3>Fuzzy Matching</h3>
              <p>Advanced string similarity algorithms handle data inconsistencies and variations in invoice formatting.</p>
            </div>
            <div className="tech-item">
              <TrendingUp className="tech-icon" />
              <h3>Machine Learning</h3>
              <p>Continuously improving match accuracy through pattern recognition and confidence scoring.</p>
            </div>
            <div className="tech-item">
              <Shield className="tech-icon" />
              <h3>Secure Processing</h3>
              <p>Bank-grade security ensures your financial data is protected throughout the reconciliation process.</p>
            </div>
            <div className="tech-item">
              <Globe className="tech-icon" />
              <h3>Cloud Native</h3>
              <p>Scalable cloud infrastructure handles large datasets with lightning-fast processing speeds.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="benefits-content">
          <h2>Key Benefits</h2>
          <div className="benefits-list">
            <div className="benefit">
              <div className="benefit-icon">
                <Award className="icon" />
              </div>
              <div className="benefit-text">
                <h3>Unmatched Accuracy</h3>
                <p>95%+ matching accuracy with detailed confidence scores for every match</p>
              </div>
            </div>
            <div className="benefit">
              <div className="benefit-icon">
                <Zap className="icon" />
              </div>
              <div className="benefit-text">
                <h3>Lightning Speed</h3>
                <p>Process thousands of records in seconds, not hours or days</p>
              </div>
            </div>
            <div className="benefit">
              <div className="benefit-icon">
                <TrendingUp className="icon" />
              </div>
              <div className="benefit-text">
                <h3>Comprehensive Reporting</h3>
                <p>Detailed analytics, variance analysis, and audit-ready documentation</p>
              </div>
            </div>
            <div className="benefit">
              <div className="benefit-icon">
                <Users className="icon" />
              </div>
              <div className="benefit-text">
                <h3>Team Efficiency</h3>
                <p>Free your finance team to focus on strategic analysis instead of manual data entry</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact">
        <div className="contact-content">
          <h2>Get in Touch</h2>
          <p>
            Ready to transform your reconciliation process? Contact our team to learn 
            how LedgerLink can streamline your financial operations.
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <strong>Email:</strong> support@ledgerlink.com
            </div>
            <div className="contact-item">
              <strong>Phone:</strong> 1-800-LEDGER-1
            </div>
            <div className="contact-item">
              <strong>Support:</strong> Available 24/7 for enterprise customers
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;