import React from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import LedgerLinkLogo from '../components/ui/LedgerLinkLogo';

interface LandingPageProps {
  onLogin: () => void;
  onTryForFree: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onTryForFree }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Navigation */}
        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <LedgerLinkLogo size={40} withText={true} color="#6366f1" />
            
            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onLogin}>
                Login
              </Button>
              <Button variant="primary" onClick={onTryForFree}>
                Try for free
              </Button>
            </div>
          </div>
        </nav>
        
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight">
              Automate your{' '}
              <span className="text-primary-500">ledger reconciliation</span>
            </h1>
            
            <p className="mt-6 max-w-3xl mx-auto text-xl text-neutral-600 leading-relaxed">
              Connect your accounting systems and automatically match invoices, identify discrepancies, 
              and reconcile accounts receivable and payable ledgers with confidence.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={onTryForFree}
                className="text-lg px-8 py-4"
              >
                Start free trial
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={onLogin}
                className="text-lg px-8 py-4"
              >
                Login
              </Button>
            </div>
            
            <p className="mt-4 text-sm text-neutral-500">
              No credit card required • CSV upload available instantly
            </p>
          </div>
        </div>
        
        {/* Hero Visual/Dashboard Preview */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <Card className="shadow-2xl border border-neutral-200">
            <div className="bg-neutral-900 px-6 py-4 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-error rounded-full"></div>
                <div className="w-3 h-3 bg-warning rounded-full"></div>
                <div className="w-3 h-3 bg-success rounded-full"></div>
              </div>
            </div>
            <div className="p-8 bg-white">
              {/* Mock dashboard content */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-h3 text-neutral-900">Account Reconciliation</h3>
                  <div className="flex space-x-4">
                    <div className="text-center">
                      <div className="text-h2 font-bold text-success">94%</div>
                      <div className="text-small text-neutral-600">Matched</div>
                    </div>
                    <div className="text-center">
                      <div className="text-h2 font-bold text-warning">5%</div>
                      <div className="text-small text-neutral-600">Partial</div>
                    </div>
                    <div className="text-center">
                      <div className="text-h2 font-bold text-error">1%</div>
                      <div className="text-small text-neutral-600">Unmatched</div>
                    </div>
                  </div>
                </div>
                
                {/* Mock table */}
                <div className="border border-neutral-200 rounded-md">
                  <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                    <div className="grid grid-cols-5 gap-4 text-xs font-medium text-neutral-700 uppercase">
                      <div>Invoice #</div>
                      <div>Customer</div>
                      <div>Amount</div>
                      <div>Match Status</div>
                      <div>Confidence</div>
                    </div>
                  </div>
                  
                  {/* Mock rows */}
                  {[
                    { invoice: 'INV-001', customer: 'Acme Corp', amount: '$1,250.00', status: 'Matched', confidence: '100%', statusColor: 'success' },
                    { invoice: 'INV-002', customer: 'Beta Ltd', amount: '$850.75', status: 'Partial', confidence: '85%', statusColor: 'warning' },
                    { invoice: 'INV-003', customer: 'Gamma Inc', amount: '$2,100.00', status: 'Matched', confidence: '100%', statusColor: 'success' },
                  ].map((row, index) => (
                    <div key={index} className="px-4 py-3 border-b border-neutral-200 last:border-b-0">
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div className="font-mono text-neutral-900">{row.invoice}</div>
                        <div className="text-neutral-900">{row.customer}</div>
                        <div className="font-mono text-neutral-900">{row.amount}</div>
                        <div>
                          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                            row.statusColor === 'success' ? 'bg-success-100 text-success-600' :
                            row.statusColor === 'warning' ? 'bg-warning-100 text-warning-600' :
                            'bg-error-100 text-error-600'
                          }`}>
                            {row.status}
                          </span>
                        </div>
                        <div className="font-mono text-neutral-900">{row.confidence}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Features Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              Everything you need for ledger reconciliation
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Stop spending hours manually matching invoices. Our AI-powered system does the heavy lifting.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
                title: 'System Integration',
                description: 'Connect directly with Xero, QuickBooks, Sage, and other popular accounting platforms.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Intelligent Matching',
                description: 'Advanced algorithms match invoices by number, amount, date, and reference with high accuracy.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: 'Counterparty Linking',
                description: 'Invite customers and vendors to link their systems for real-time reconciliation.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Detailed Reporting',
                description: 'Export comprehensive reports in PDF and CSV formats with full audit trails.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Secure & Private',
                description: 'Bank-grade security with encrypted data transmission and secure counterparty sharing.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                ),
                title: 'CSV Upload',
                description: 'No integration? No problem. Upload your ledger data via CSV and start matching immediately.',
              },
            ].map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-240">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="text-primary-600">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-h3 text-neutral-900 mb-2">{feature.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-body text-neutral-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to automate your reconciliation?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join businesses saving hours every month with automated ledger matching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={onTryForFree}
              className="bg-white text-primary-600 hover:bg-neutral-50 text-lg px-8 py-4"
            >
              Try for free
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={onLogin}
              className="text-white border-white hover:bg-primary-600 text-lg px-8 py-4"
            >
              Login
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-neutral-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <LedgerLinkLogo size={32} withText={true} color="#6366f1" className="mb-4 md:mb-0" />
            
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
              <p className="text-neutral-400 text-sm text-center md:text-left">
                © 2025 LedgerLink. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors duration-120">
                  Privacy Policy
                </a>
                <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors duration-120">
                  Terms of Service
                </a>
                <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors duration-120">
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};