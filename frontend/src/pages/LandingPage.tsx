import React from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export interface LandingPageProps {
  onLogin: () => void;
  onTryForFree: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onTryForFree }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-20 pb-16 text-center lg:pt-32">
            {/* Main Heading */}
            <h1 className="mx-auto max-w-4xl text-h1 md:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight">
              Reconcile your ledgers with
              <span className="text-primary-500"> complete confidence</span>
            </h1>
            
            {/* Subheading */}
            <p className="mx-auto mt-6 max-w-2xl text-body-lg md:text-xl text-neutral-600 leading-relaxed">
              Automatically match invoices between your AR and AP ledgers. 
              Connect your ERP systems, invite counterparties, and eliminate 
              reconciliation headaches forever.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={onLogin}
                className="w-full sm:w-auto min-w-[160px]"
              >
                Login
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={onTryForFree}
                className="w-full sm:w-auto min-w-[160px]"
              >
                Try for free
              </Button>
            </div>
            
            {/* Trust indicators */}
            <p className="mt-6 text-small text-neutral-500">
              No credit card required • 30-day free trial • Enterprise-grade security
            </p>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-h2 md:text-4xl font-bold text-neutral-900">
              Why finance teams choose LedgerLink
            </h2>
            <p className="mt-4 text-body-lg text-neutral-600 max-w-2xl mx-auto">
              Stop spending hours on manual reconciliation. Get instant insights 
              into discrepancies and maintain perfect audit trails.
            </p>
          </div>
          
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow duration-240">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
                  Instant Matching
                </h3>
                <p className="text-body text-neutral-600">
                  AI-powered invoice matching with confidence scores. 
                  Identify perfect matches, discrepancies, and missing items in seconds.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 2 */}
            <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow duration-240">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
                  ERP Integration
                </h3>
                <p className="text-body text-neutral-600">
                  Connect directly to Xero, QuickBooks, SAP, NetSuite, and more. 
                  Real-time sync keeps your data always up-to-date.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 3 */}
            <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow duration-240">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
                  Counterparty Network
                </h3>
                <p className="text-body text-neutral-600">
                  Invite customers and vendors to connect their systems. 
                  Create a trusted network for transparent reconciliation.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 4 */}
            <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow duration-240">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-error-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
                  Smart Insights
                </h3>
                <p className="text-body text-neutral-600">
                  Get actionable insights on why mismatches occur. 
                  Historical analysis helps prevent future discrepancies.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 5 */}
            <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow duration-240">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
                  Enterprise Security
                </h3>
                <p className="text-body text-neutral-600">
                  Bank-grade encryption, SOC 2 compliance, and granular 
                  access controls keep your financial data completely secure.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 6 */}
            <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow duration-240">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
                  Export & Reports
                </h3>
                <p className="text-body text-neutral-600">
                  Generate detailed reconciliation reports in PDF or CSV. 
                  Perfect for audits, compliance, and stakeholder updates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 md:text-4xl font-bold text-white">
            Ready to transform your reconciliation process?
          </h2>
          <p className="mt-4 text-body-lg text-primary-100 max-w-2xl mx-auto">
            Join thousands of finance teams who've eliminated manual reconciliation forever. 
            Start matching invoices in minutes, not hours.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={onTryForFree}
              className="w-full sm:w-auto min-w-[200px] bg-white text-primary-600 hover:bg-neutral-50"
            >
              Start free trial
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={onLogin}
              className="w-full sm:w-auto min-w-[160px] text-white border-white hover:bg-primary-700"
            >
              Sign in
            </Button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">LL</span>
              </div>
              <span className="text-h3 font-semibold text-white">LedgerLink</span>
            </div>
            <p className="text-sm">
              © 2024 LedgerLink. All rights reserved. 
              Enterprise-grade account reconciliation for modern finance teams.
            </p>
            <div className="mt-4 space-x-6">
              <a href="#" className="text-sm hover:text-white transition-colors duration-120">
                Privacy Policy
              </a>
              <a href="#" className="text-sm hover:text-white transition-colors duration-120">
                Terms of Service
              </a>
              <a href="#" className="text-sm hover:text-white transition-colors duration-120">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export { LandingPage };