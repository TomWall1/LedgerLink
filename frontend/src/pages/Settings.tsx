import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';

export interface SettingsProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

interface UserProfile {
  name: string;
  email: string;
  company: string;
  role: string;
  timezone: string;
  notifications: {
    email: boolean;
    browser: boolean;
    weekly: boolean;
  };
}

interface MatchingRules {
  amountTolerance: number;
  dateTolerance: number;
  autoMatchThreshold: number;
  requireExactInvoiceNumber: boolean;
  enableFuzzyMatching: boolean;
}

const Settings: React.FC<SettingsProps> = ({ isLoggedIn, onLogin, user }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || 'John Smith',
    email: user?.email || 'john.smith@company.com',
    company: 'Acme Corporation',
    role: 'Finance Manager',
    timezone: 'America/New_York',
    notifications: {
      email: true,
      browser: true,
      weekly: false,
    },
  });
  
  const [matchingRules, setMatchingRules] = useState<MatchingRules>({
    amountTolerance: 0.01, // 1%
    dateTolerance: 7, // 7 days
    autoMatchThreshold: 95, // 95%
    requireExactInvoiceNumber: false,
    enableFuzzyMatching: true,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();
  
  if (!isLoggedIn) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-h2 font-bold text-neutral-900 mb-4">
            Account Required
          </h2>
          <p className="text-body-lg text-neutral-600 mb-8">
            Please create an account to access settings and customize your 
            LedgerLink experience.
          </p>
          <Button variant="primary" onClick={onLogin}>
            Create Account
          </Button>
        </div>
      </div>
    );
  }
  
  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      success('Profile updated successfully');
    }, 1000);
  };
  
  const handleSaveMatchingRules = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      success('Matching rules updated successfully');
    }, 1000);
  };
  
  const handleExportData = () => {
    success('Data export initiated. You will receive an email when ready.');
  };
  
  const handleDeleteAccount = () => {
    setIsDeleteModalOpen(false);
    error('Account deletion is not available in this demo');
  };
  
  const sections = [
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'matching',
      label: 'Matching Rules',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.97 4.97a1.94 1.94 0 014.06 0l6.06 6.06c.98.98.98 2.56 0 3.54l-6.06 6.06a1.94 1.94 0 01-4.06 0L4.91 14.57c-.98-.98-.98-2.56 0-3.54l6.06-6.06z" />
        </svg>
      ),
    },
    {
      id: 'security',
      label: 'Security',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 'billing',
      label: 'Billing & Plan',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ];
  
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-h1 font-bold text-neutral-900">Settings</h1>
          <p className="mt-1 text-body text-neutral-600">
            Manage your account, preferences, and system configuration
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="lg:col-span-1">
            <CardContent className="p-0">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium rounded-md transition-colors duration-120 ${
                      activeSection === section.id
                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span className={activeSection === section.id ? 'text-primary-600' : 'text-neutral-400'}>
                      {section.icon}
                    </span>
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
          
          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <Card>
                <CardHeader>
                  <h2 className="text-h3 font-semibold text-neutral-900">Profile Information</h2>
                  <p className="text-body text-neutral-600">Update your personal and company details</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        value={profile.name}
                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Company"
                        value={profile.company}
                        onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                      />
                      <Input
                        label="Role"
                        value={profile.role}
                        onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Timezone
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                        value={profile.timezone}
                        onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                      >
                        <option value="America/New_York">Eastern Time (UTC-5)</option>
                        <option value="America/Chicago">Central Time (UTC-6)</option>
                        <option value="America/Denver">Mountain Time (UTC-7)</option>
                        <option value="America/Los_Angeles">Pacific Time (UTC-8)</option>
                        <option value="Europe/London">London (UTC+0)</option>
                        <option value="Europe/Paris">Paris (UTC+1)</option>
                        <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                        <option value="Australia/Sydney">Sydney (UTC+11)</option>
                      </select>
                    </div>
                    
                    <Button 
                      variant="primary" 
                      onClick={handleSaveProfile}
                      isLoading={isSaving}
                    >
                      Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Matching Rules Section */}
            {activeSection === 'matching' && (
              <Card>
                <CardHeader>
                  <h2 className="text-h3 font-semibold text-neutral-900">Matching Rules</h2>
                  <p className="text-body text-neutral-600">Configure how invoices are matched between systems</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Amount Tolerance (%)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={matchingRules.amountTolerance}
                          onChange={(e) => setMatchingRules(prev => ({ ...prev, amountTolerance: parseFloat(e.target.value) }))}
                          helperText="Allow amount differences up to this percentage"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Date Tolerance (days)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="30"
                          value={matchingRules.dateTolerance}
                          onChange={(e) => setMatchingRules(prev => ({ ...prev, dateTolerance: parseInt(e.target.value) }))}
                          helperText="Allow date differences up to this many days"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Auto-Match Threshold (%)
                      </label>
                      <Input
                        type="number"
                        min="50"
                        max="100"
                        value={matchingRules.autoMatchThreshold}
                        onChange={(e) => setMatchingRules(prev => ({ ...prev, autoMatchThreshold: parseInt(e.target.value) }))}
                        helperText="Automatically approve matches above this confidence level"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="exact-invoice"
                          checked={matchingRules.requireExactInvoiceNumber}
                          onChange={(e) => setMatchingRules(prev => ({ ...prev, requireExactInvoiceNumber: e.target.checked }))}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                        />
                        <label htmlFor="exact-invoice" className="text-sm text-neutral-700">
                          Require exact invoice number matches
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="fuzzy-matching"
                          checked={matchingRules.enableFuzzyMatching}
                          onChange={(e) => setMatchingRules(prev => ({ ...prev, enableFuzzyMatching: e.target.checked }))}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                        />
                        <label htmlFor="fuzzy-matching" className="text-sm text-neutral-700">
                          Enable fuzzy matching for invoice numbers (OCR error correction)
                        </label>
                      </div>
                    </div>
                    
                    <Button 
                      variant="primary" 
                      onClick={handleSaveMatchingRules}
                      isLoading={isSaving}
                    >
                      Save Matching Rules
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <Card>
                <CardHeader>
                  <h2 className="text-h3 font-semibold text-neutral-900">Notification Preferences</h2>
                  <p className="text-body text-neutral-600">Choose how you want to be notified about system events</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-body font-medium text-neutral-900">Email Notifications</h4>
                          <p className="text-small text-neutral-600">Receive email alerts for matching results and system updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profile.notifications.email}
                            onChange={(e) => setProfile(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, email: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-body font-medium text-neutral-900">Browser Notifications</h4>
                          <p className="text-small text-neutral-600">Show desktop notifications for real-time updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profile.notifications.browser}
                            onChange={(e) => setProfile(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, browser: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-body font-medium text-neutral-900">Weekly Reports</h4>
                          <p className="text-small text-neutral-600">Receive weekly summary reports via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profile.notifications.weekly}
                            onChange={(e) => setProfile(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, weekly: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <Button 
                      variant="primary" 
                      onClick={handleSaveProfile}
                      isLoading={isSaving}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Security Section */}
            {activeSection === 'security' && (
              <Card>
                <CardHeader>
                  <h2 className="text-h3 font-semibold text-neutral-900">Security Settings</h2>
                  <p className="text-body text-neutral-600">Manage your account security and privacy</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-body font-medium text-neutral-900 mb-2">Change Password</h4>
                        <p className="text-small text-neutral-600 mb-4">Update your account password</p>
                        <Button variant="secondary">
                          Change Password
                        </Button>
                      </div>
                      
                      <div>
                        <h4 className="text-body font-medium text-neutral-900 mb-2">Two-Factor Authentication</h4>
                        <p className="text-small text-neutral-600 mb-4">Add an extra layer of security</p>
                        <Badge variant="warning">Not Enabled</Badge>
                        <div className="mt-2">
                          <Button variant="secondary">
                            Enable 2FA
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-body font-medium text-neutral-900 mb-2">Active Sessions</h4>
                      <p className="text-small text-neutral-600 mb-4">Manage your active login sessions</p>
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">Current Session</p>
                            <p className="text-xs text-neutral-600">Chrome on Windows • Melbourne, VIC • Active now</p>
                          </div>
                          <Badge variant="success">Current</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-body font-medium text-neutral-900 mb-2">Data Export</h4>
                      <p className="text-small text-neutral-600 mb-4">Download a copy of your account data</p>
                      <Button variant="secondary" onClick={handleExportData}>
                        Request Data Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Billing Section */}
            {activeSection === 'billing' && (
              <Card>
                <CardHeader>
                  <h2 className="text-h3 font-semibold text-neutral-900">Billing & Subscription</h2>
                  <p className="text-body text-neutral-600">Manage your subscription and billing information</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-h3 font-semibold text-primary-900">Professional Plan</h4>
                          <p className="text-body text-primary-700">$99/month • Unlimited connections • Advanced features</p>
                          <p className="text-small text-primary-600 mt-1">Next billing date: February 15, 2024</p>
                        </div>
                        <Badge variant="success">Active</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-body font-medium text-neutral-900 mb-2">Payment Method</h4>
                        <div className="bg-neutral-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <svg className="w-8 h-8 text-neutral-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M1 4v16h22V4H1zm20 14H3V6h18v12z"/>
                              <path d="M3 8h18v2H3z"/>
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-neutral-900">•••• •••• •••• 4242</p>
                              <p className="text-xs text-neutral-600">Expires 12/25</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="secondary" className="mt-2">
                          Update Payment Method
                        </Button>
                      </div>
                      
                      <div>
                        <h4 className="text-body font-medium text-neutral-900 mb-2">Billing History</h4>
                        <div className="space-y-2">
                          <div className="bg-neutral-50 rounded-lg p-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-neutral-900">Jan 2024</span>
                              <span className="text-sm font-medium text-neutral-900">$99.00</span>
                            </div>
                            <p className="text-xs text-neutral-600">Professional Plan</p>
                          </div>
                          <div className="bg-neutral-50 rounded-lg p-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-neutral-900">Dec 2023</span>
                              <span className="text-sm font-medium text-neutral-900">$99.00</span>
                            </div>
                            <p className="text-xs text-neutral-600">Professional Plan</p>
                          </div>
                        </div>
                        <Button variant="secondary" className="mt-2">
                          View All Invoices
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t border-neutral-200 pt-6">
                      <h4 className="text-body font-medium text-neutral-900 mb-4">Danger Zone</h4>
                      <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-error-900 mb-2">Delete Account</h5>
                        <p className="text-small text-error-700 mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <Button 
                          variant="destructive" 
                          onClick={() => setIsDeleteModalOpen(true)}
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account"
        description="This action cannot be undone. All your data will be permanently deleted."
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-error-50 border border-error-200 rounded-md p-4">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-error-800">Warning: This is permanent</p>
                <p className="text-xs text-error-700">All your connections, data, and reports will be lost forever.</p>
              </div>
            </div>
          </div>
          
          <Input
            label="Type 'DELETE' to confirm"
            placeholder="DELETE"
            helperText="Type the word DELETE in all caps to confirm"
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export { Settings };