import React from 'react';

const HomePage = ({ onLogin, onTryForFree }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LedgerLink</h1>
                <p className="text-sm text-gray-500 hidden sm:block">Account Reconciliation</p>
              </div>
            </div>

            {/* Login Button in Header */}
            <button
              onClick={onLogin}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Headline */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Automate Your
              <span className="block text-blue-600">Invoice Reconciliation</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Stop spending hours manually matching invoices. LedgerLink uses intelligent algorithms 
              to reconcile your accounts automatically, saving you time and reducing errors.
            </p>
          </div>

          {/* Main CTAs */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button
              onClick={onTryForFree}
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Try for Free
              <span className="block text-sm font-normal mt-1 text-blue-100">No signup required</span>
            </button>
            
            <button
              onClick={onLogin}
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              Login to Account
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">CSV Matching</h3>
              <p className="text-gray-600">
                Upload your CSV files and let our intelligent engine automatically match invoices with payments and statements.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">94%+ Match Rate</h3>
              <p className="text-gray-600">
                Our advanced algorithms achieve industry-leading match rates, dramatically reducing manual review time.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Xero Integration</h3>
              <p className="text-gray-600">
                Seamlessly connect with Xero to automatically sync your accounting data and streamline your workflow.
              </p>
            </div>
          </div>

          {/* Social Proof / Stats */}
          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">1,247+</div>
                <div className="text-gray-600">Invoices Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">94.2%</div>
                <div className="text-gray-600">Match Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">Hours</div>
                <div className="text-gray-600">Saved Per Week</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500">
            © 2024 LedgerLink. Streamlining account reconciliation for modern businesses.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;