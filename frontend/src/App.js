import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import NavHeader from './components/NavHeader';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Results from './pages/Results';
import AccountLinks from './pages/AccountLinks';
import XeroCallback from './components/XeroCallback';
import { XeroProvider } from './context/XeroContext';

function App() {
  return (
    <XeroProvider>
      <div className="App">
        <NavHeader />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/results" element={<Results />} />
            <Route path="/account-links" element={<AccountLinks />} />
            <Route path="/auth/xero/callback" element={<XeroCallback />} />
          </Routes>
        </div>
      </div>
    </XeroProvider>
  );
}

export default App;