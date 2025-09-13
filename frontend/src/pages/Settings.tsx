import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  
  // Profile settings
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    company: 'Example Corp',
    phone: '+1 (555) 123-4567',
    timezone: 'America/New_York'
  });
  
  // Matching settings
  const [matchingSettings, setMatchingSettings] = useState({
    dateToleranceDays: 7,
    amountTolerancePercent: 2,
    requireExactMatch: false,
    autoProcessMatches: true,
    confidenceThreshold: 85,
    enableFuzzyMatching: true
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    emailMatches: true,
    emailDiscrepancies: true,
    emailReports: false,
    emailSystemUpdates: true,
    pushEnabled: false,
    weeklyDigest: true
  });
  
  // Security settings
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 24,
    lastPasswordChange: '2024-01-15',
    activeDevices: 3
  });
  
  const tabs = [
    { id: 'profile', name: 'Profile', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { id: 'matching', name: 'Matching Rules', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { id: 'notifications', name: 'Notifications', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.97 4.97a.235.235 0 00-.02.022L9.477 6.417 8.05 7.847a.698.698 0 01-.988-.01L6.05 6.825a.71.71 0 01-.207-.5c0-.19.074-.372.207-.506l.707-.707M10.97 4.97s.018-.013.028-.02c.298-.164.636-.22.968-.14.332.081.63.284.821.567.191.282.267.62.213.953a1.125 1.125 0 01-.44.832c-.109.073-.234.130-.363.167-.742.21-1.527.32-2.334.32-2.08 0-3.903-.903-5.187-2.34L2.34 2.34A8 8 0 1021.66 21.66 8 8 0 0010.97 4.97z" />
      </svg>
    )},
    { id: 'security', name: 'Security', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )},
    { id: 'billing', name: 'Billing', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )}
  ];
  
  const handleSaveProfile = () => {
    console.log('Saving profile:', profile);
  };
  
  const handleSaveMatchingSettings = () => {
    console.log('Saving matching settings:', matchingSettings);
  };
  
  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="First Name"
          value={profile.firstName}
          onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
        />
        <Input
          label="Last Name"
          value={profile.lastName}
          onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
        />
      </div>
      
      <Input
        label="Email Address"
        type="email"
        value={profile.email}
        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
        helperText="This email is used for notifications and account recovery"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Company"
          value={profile.company}
          onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
        />
        <Input
          label="Phone Number"
          value={profile.phone}
          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Timezone
        </label>
        <select
          value={profile.timezone}
          onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
          className="input w-full"
        >
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="Europe/London">London (GMT)</option>
          <option value="Europe/Paris">Paris (CET)</option>
          <option value="Asia/Tokyo">Tokyo (JST)</option>
        </select>
      </div>
      
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSaveProfile}>
          Save Changes
        </Button>
      </div>
    </div>
  );
  
  const renderMatchingTab = () => (
    <div className="space-y-6">
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h4 className="font-medium text-primary-900 mb-2">Matching Algorithm Settings</h4>
        <p className="text-small text-primary-700">
          Configure how LedgerLink matches invoices between your systems and counterparties.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Date Tolerance (days)
          </label>
          <input
            type="number"
            min="0"
            max="30"
            value={matchingSettings.dateToleranceDays}
            onChange={(e) => setMatchingSettings(prev => ({ ...prev, dateToleranceDays: parseInt(e.target.value) || 0 }))}
            className="input w-full"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Allow date differences within this range
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Amount Tolerance (%)
          </label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={matchingSettings.amountTolerancePercent}
            onChange={(e) => setMatchingSettings(prev => ({ ...prev, amountTolerancePercent: parseFloat(e.target.value) || 0 }))}
            className="input w-full"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Allow amount differences within this percentage
          </p>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Confidence Threshold (%)
        </label>
        <input
          type="range"
          min="50"
          max="100"
          value={matchingSettings.confidenceThreshold}
          onChange={(e) => setMatchingSettings(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))}
          className="w-full"
        />
        <div className="flex justify-between text-small text-neutral-600 mt-1">
          <span>50%</span>
          <span className="font-medium">Current: {matchingSettings.confidenceThreshold}%</span>
          <span>100%</span>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Minimum confidence required for automatic matches
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-body font-medium text-neutral-900">Auto-process High Confidence Matches</h4>
            <p className="text-small text-neutral-600">Automatically mark matches above threshold as processed</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={matchingSettings.autoProcessMatches}
              onChange={(e) => setMatchingSettings(prev => ({ ...prev, autoProcessMatches: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-body font-medium text-neutral-900">Enable Fuzzy Matching</h4>
            <p className="text-small text-neutral-600">Match similar invoice numbers and references</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={matchingSettings.enableFuzzyMatching}
              onChange={(e) => setMatchingSettings(prev => ({ ...prev, enableFuzzyMatching: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-body font-medium text-neutral-900">Require Exact Match</h4>
            <p className="text-small text-neutral-600">Only match invoices with identical numbers and amounts</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={matchingSettings.requireExactMatch}
              onChange={(e) => setMatchingSettings(prev => ({ ...prev, requireExactMatch: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSaveMatchingSettings}>
          Save Matching Settings
        </Button>
      </div>
    </div>
  );
  
  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-h3 text-neutral-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          {[
            { key: 'emailMatches', label: 'New Matches Found', description: 'Get notified when new invoice matches are detected' },
            { key: 'emailDiscrepancies', label: 'Discrepancies Detected', description: 'Alert when unmatched transactions are found' },
            { key: 'emailReports', label: 'Report Generation', description: 'Notification when reports are ready for download' },
            { key: 'emailSystemUpdates', label: 'System Updates', description: 'Important system maintenance and feature updates' },
            { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Summary of reconciliation activity and metrics' }
          ].map((notification) => (
            <div key={notification.key} className="flex items-center justify-between">
              <div>
                <h4 className="text-body font-medium text-neutral-900">{notification.label}</h4>
                <p className="text-small text-neutral-600">{notification.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[notification.key as keyof typeof notifications] as boolean}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [notification.key]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const renderSecurityTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-h3 text-neutral-900">Password & Authentication</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-body font-medium text-neutral-900">Password</h4>
                <p className="text-small text-neutral-600">Last changed on {security.lastPasswordChange}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setResetPasswordModal(true)}>
                Change Password
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-body font-medium text-neutral-900">Two-Factor Authentication</h4>
                <p className="text-small text-neutral-600">
                  {security.twoFactorEnabled ? 'Enabled - Your account has an extra layer of security' : 'Add an extra layer of security to your account'}
                </p>
              </div>
              <Button 
                variant={security.twoFactorEnabled ? "ghost" : "primary"} 
                size="sm"
              >
                {security.twoFactorEnabled ? 'Manage' : 'Enable'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-h3 text-neutral-900">Active Sessions</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">Current Session</p>
                  <p className="text-xs text-neutral-600">Chrome on Windows • Active now</p>
                </div>
              </div>
              <Badge variant="success">Current</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">Mobile App</p>
                  <p className="text-xs text-neutral-600">iPhone • 2 hours ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">Revoke</Button>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">Safari on macOS</p>
                  <p className="text-xs text-neutral-600">MacBook Pro • 1 day ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">Revoke</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  const renderBillingTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h3 text-neutral-900">Current Plan</h3>
              <p className="text-body text-neutral-600 mt-1">Professional Plan</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-body text-neutral-900">Monthly subscription</span>
              <span className="text-body font-semibold text-neutral-900">$49.99/month</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body text-neutral-900">Next billing date</span>
              <span className="text-body text-neutral-900">February 15, 2024</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body text-neutral-900">Payment method</span>
              <span className="text-body text-neutral-900">•••• 4242</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex space-x-3">
            <Button variant="ghost" size="sm">
              Change Plan
            </Button>
            <Button variant="ghost" size="sm">
              Update Payment
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-h3 text-neutral-900">Usage This Month</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-small text-neutral-600 mb-1">
                <span>Transactions Processed</span>
                <span>2,547 / 5,000</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '51%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-small text-neutral-600 mb-1">
                <span>Connected Systems</span>
                <span>3 / 10</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  const renderDangerZone = () => (
    <Card className="border-error">
      <CardHeader>
        <h3 className="text-h3 text-error">Danger Zone</h3>
        <p className="text-body text-neutral-600 mt-1">
          Irreversible and destructive actions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-body font-medium text-neutral-900">Delete Account</h4>
              <p className="text-small text-neutral-600">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setDeleteAccountModal(true)}>
              Delete Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 text-neutral-900 mb-2">Settings</h1>
        <p className="text-body-lg text-neutral-600">
          Manage your account preferences, security settings, and system configuration.
        </p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-120 ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-500'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader>
              <h2 className="text-h2 text-neutral-900">
                {tabs.find(tab => tab.id === activeTab)?.name}
              </h2>
            </CardHeader>
            <CardContent>
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'matching' && renderMatchingTab()}
              {activeTab === 'notifications' && renderNotificationsTab()}
              {activeTab === 'security' && renderSecurityTab()}
              {activeTab === 'billing' && renderBillingTab()}
            </CardContent>
          </Card>
          
          {activeTab === 'security' && (
            <div className="mt-8">
              {renderDangerZone()}
            </div>
          )}
        </div>
      </div>
      
      {/* Reset Password Modal */}
      <Modal
        isOpen={resetPasswordModal}
        onClose={() => setResetPasswordModal(false)}
        title="Change Password"
        description="Enter your current password and choose a new one"
      >
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm new password"
          />
          
          <div className="flex space-x-3 pt-4">
            <Button variant="primary" className="flex-1">
              Update Password
            </Button>
            <Button variant="ghost" onClick={() => setResetPasswordModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Delete Account Modal */}
      <Modal
        isOpen={deleteAccountModal}
        onClose={() => setDeleteAccountModal(false)}
        title="Delete Account"
        description="This action cannot be undone. All your data will be permanently deleted."
      >
        <div className="space-y-4">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4">
            <h4 className="font-medium text-error-900 mb-2">This will permanently delete:</h4>
            <ul className="text-small text-error-700 space-y-1">
              <li>• Your account and profile</li>
              <li>• All reconciliation data and reports</li>
              <li>• Connected system integrations</li>
              <li>• Counterparty relationships</li>
            </ul>
          </div>
          
          <Input
            label='Type "DELETE" to confirm'
            placeholder="DELETE"
            helperText="This confirmation is required to proceed with account deletion"
          />
          
          <div className="flex space-x-3 pt-4">
            <Button variant="destructive" className="flex-1">
              Delete Account
            </Button>
            <Button variant="ghost" onClick={() => setDeleteAccountModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};