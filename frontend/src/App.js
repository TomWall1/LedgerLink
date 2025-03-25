import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import NavHeader from './components/NavHeader';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Results from './pages/Results';
import AccountLinks from './pages/AccountLinks';
import System from './pages/System';
import XeroCallback from './components/XeroCallback';
import { XeroProvider } from './context/XeroContext';

function App() {
  return (
    <XeroProvider>
      <div className="App bg-white"> {/* Changed from bg-gray-50 to bg-white */}
        <NavHeader />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={
            <div className="container">
              <Upload />
            </div>
          } />
          <Route path="/results" element={
            <div className="container">
              <Results />
            </div>
          } />
          <Route path="/account-links" element={
            <div className="container">
              <AccountLinks />
            </div>
          } />
          <Route path="/system" element={
            <div className="container">
              <System />
            </div>
          } />
          <Route path="/auth/xero/callback" element={
            <div className="container">
              <XeroCallback />
            </div>
          } />
        </Routes>
      </div>
    </XeroProvider>
  );
}

export default App;