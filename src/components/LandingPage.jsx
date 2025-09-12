import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">LL</span>
            </div>
            <span className="text-2xl font-bold text-[#1B365D]">LedgerLink</span>
          </div>
          
          <div className="flex space-x-4">
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-[#1B365D] mb-6">
            Automate Your Invoice Matching
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Streamline your accounting workflow with AI-powered CSV transaction matching. 
            Connect to Xero and match transactions with confidence scoring in minutes, not hours.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors flex items-center justify-center"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg font-medium text-lg transition-colors flex items-center justify-center"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#1B365D] mb-4">Why Choose LedgerLink?</h2>
          <p className="text-gray-600 text-lg">Built specifically for Australian businesses and accounting professionals</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1B365D] mb-4">Smart AI Matching</h3>
            <p className="text-gray-600">
              Our intelligent algorithm matches transactions with 95% accuracy using amount, date, and reference analysis with confidence scoring.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition-shadow">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1B365D] mb-4">Xero Integration</h3>
            <p className="text-gray-600">
              Seamlessly connect to your Xero account with secure OAuth 2.0. Import customers, invoices, and sync data automatically.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition-shadow">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1B365D] mb-4">Australian Focus</h3>
            <p className="text-gray-600">
              Built for Australian businesses with DD/MM/YYYY dates, AUD currency, and compliance with local accounting standards.
            </p>
          </div>
        </div>
      </section>
      
      {/* Process Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1B365D] mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg">Simple 3-step process to match your transactions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-[#1B365D] mb-4">Connect & Upload</h3>
              <p className="text-gray-600">
                Connect your Xero account and upload your CSV transaction file. We support all major bank formats.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-[#1B365D] mb-4">AI Matching</h3>
              <p className="text-gray-600">
                Our AI engine analyzes amounts, dates, and references to find potential matches with confidence scores.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-[#1B365D] mb-4">Review & Approve</h3>
              <p className="text-gray-600">
                Review suggested matches, approve the ones you want, and export results back to your accounting system.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Automate Your Invoice Matching?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join hundreds of Australian businesses saving hours each week with automated transaction matching.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-lg font-medium text-lg transition-colors flex items-center justify-center"
            >
              Start Free Trial
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="border-2 border-white hover:bg-white hover:text-blue-600 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors flex items-center justify-center"
            >
              Existing User? Sign In
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LL</span>
              </div>
              <span className="text-xl font-bold">LedgerLink</span>
            </div>
            
            <div className="text-gray-400 text-center">
              <p>&copy; 2025 LedgerLink. Built with ❤️ for Australian businesses.</p>
            </div>
            
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;