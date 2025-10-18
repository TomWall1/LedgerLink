import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import axios from 'axios';

export const InviteAcceptance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteDetails, setInviteDetails] = useState<any>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code);
    }
  }, [searchParams]);

  const handleAcceptInvite = async () => {
    if (!inviteCode) {
      setError('Please enter an invitation code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // User needs to sign up or log in first
        navigate(`/login?redirect=/accept-invite?code=${inviteCode}`);
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/counterparty/invite/accept`,
        { inviteCode },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setInviteDetails(response.data.link);
        
        // Redirect to counterparties page after 3 seconds
        setTimeout(() => {
          navigate('/counterparties');
        }, 3000);
      } else {
        setError(response.data.error || 'Failed to accept invitation');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      
      if (err.response?.data?.requiresCompanySetup) {
        // User needs to set up company first
        navigate('/settings/company?message=Please set up your company profile to accept invitations');
      } else if (err.response?.status === 401) {
        // Not logged in
        navigate(`/login?redirect=/accept-invite?code=${inviteCode}`);
      } else {
        setError(err.response?.data?.error || 'Failed to accept invitation');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-h2 text-neutral-900 mb-2">Accept Invitation</h2>
            <p className="text-body text-neutral-600">
              Enter your invitation code to connect with your counterparty
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-h3 text-neutral-900 mb-2">Invitation Accepted!</h3>
              <p className="text-body text-neutral-600 mb-4">
                You are now connected with {inviteDetails?.counterparty?.name}
              </p>
              <p className="text-sm text-neutral-500">
                Redirecting to your counterparties page...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <Input
                label="Invitation Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter your 8-character code"
                helperText="The code should have been sent to you via email"
                error={error}
                maxLength={8}
                className="text-center font-mono text-lg tracking-wider"
              />

              {error && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-3">
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              <div className="bg-neutral-50 rounded-lg p-4">
                <h4 className="font-medium text-neutral-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• You'll be connected with your counterparty</li>
                  <li>• Connect your accounting system to enable matching</li>
                  <li>• View shared transaction history</li>
                  <li>• Automatic reconciliation between systems</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  onClick={handleAcceptInvite}
                  disabled={!inviteCode || loading}
                  className="flex-1"
                >
                  {loading ? 'Processing...' : 'Accept Invitation'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
