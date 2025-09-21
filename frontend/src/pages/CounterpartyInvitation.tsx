/**
 * Counterparty Invitation Page
 * 
 * This page allows users to view and accept counterparty invitations.
 * When someone invites you to be their business partner for invoice reconciliation,
 * you'll receive a link that brings you to this page.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import counterpartyService, { CounterpartyInvitation } from '../services/counterpartyService';

export const CounterpartyInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  // State management
  const [invitation, setInvitation] = useState<CounterpartyInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  /**
   * Load invitation details
   */
  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const invitationData = await counterpartyService.getInvitation(token);
        setInvitation(invitationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitation');
        console.error('Error loading invitation:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  /**
   * Handle accepting the invitation
   */
  const handleAcceptInvitation = async () => {
    if (!token) return;

    try {
      setAccepting(true);
      setError(null);
      
      await counterpartyService.acceptInvitation(token);
      setAccepted(true);
      
      // Redirect to counterparties page after a short delay
      setTimeout(() => {
        navigate('/counterparties');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      console.error('Error accepting invitation:', err);
    } finally {
      setAccepting(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  /**
   * Check if invitation is expired
   */
  const isExpired = invitation ? invitation.daysUntilExpiry <= 0 : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h2 className="text-h2 font-bold text-neutral-900 mb-2">Invalid Invitation</h2>
            <p className="text-body text-neutral-600 mb-6">{error}</p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/')}
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-green-500 text-4xl mb-4">✅</div>
            <h2 className="text-h2 font-bold text-neutral-900 mb-2">Invitation Accepted!</h2>
            <p className="text-body text-neutral-600 mb-6">
              You've successfully established a business relationship with {invitation?.primaryCompany}.
              You'll be redirected to your counterparties page shortly.
            </p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/counterparties')}
            >
              Go to Counterparties
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-h1 font-bold text-neutral-900 mb-2">
            🤝 Business Partnership Invitation
          </h1>
          <p className="text-body-lg text-neutral-600">
            You've been invited to establish a secure business relationship for automated invoice reconciliation.
          </p>
        </div>

        {invitation && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-h3 font-semibold text-neutral-900">Invitation Details</h2>
                {isExpired ? (
                  <Badge variant="error">Expired</Badge>
                ) : (
                  <Badge variant="success">
                    {invitation.daysUntilExpiry === 0 
                      ? 'Expires today' 
                      : `${invitation.daysUntilExpiry} days left`
                    }
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Invitation Overview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    You're invited to be a {invitation.type}
                  </h3>
                  <p className="text-blue-800 text-sm">
                    {invitation.type === 'customer' 
                      ? `${invitation.primaryCompany} wants to reconcile invoices they send to you`
                      : `${invitation.primaryCompany} wants to reconcile invoices you send to them`
                    }
                  </p>
                </div>

                {/* Company Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-neutral-900 mb-3">Inviting Company</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Company:</span>
                        <span className="font-medium">{invitation.primaryCompany}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Contact:</span>
                        <span className="font-medium">{invitation.primaryUser.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Email:</span>
                        <span className="font-medium">{invitation.primaryUser.email}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-neutral-900 mb-3">Your Role</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Company:</span>
                        <span className="font-medium">{invitation.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Type:</span>
                        <span className="font-medium capitalize">{invitation.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Expires:</span>
                        <span className="font-medium">{formatDate(invitation.expiresAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* What happens next */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">What happens when you accept?</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• You'll establish a secure business relationship with {invitation.primaryCompany}</li>
                    <li>• You can connect your accounting system in read-only mode</li>
                    <li>• Both parties can run invoice reconciliation matches</li>
                    <li>• You maintain full control over your data at all times</li>
                    <li>• Either party can end the relationship at any time</li>
                  </ul>
                </div>

                {/* Security information */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <h4 className="font-medium text-neutral-900 mb-2">🔒 Security & Privacy</h4>
                  <ul className="text-sm text-neutral-700 space-y-1">
                    <li>• No sensitive financial data is shared between companies</li>
                    <li>• Only invoice numbers, amounts, and dates are used for matching</li>
                    <li>• All connections are read-only and encrypted</li>
                    <li>• You can revoke access at any time</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {isExpired ? (
            <div className="text-center">
              <p className="text-neutral-600 mb-4">This invitation has expired</p>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
              >
                Go to Homepage
              </Button>
            </div>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                disabled={accepting}
              >
                Decline
              </Button>
              <Button 
                variant="primary" 
                onClick={handleAcceptInvitation}
                disabled={accepting}
                isLoading={accepting}
                className="min-w-32"
              >
                Accept Invitation
              </Button>
            </>
          )}
        </div>

        {/* Help text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-600">
            Need help? Contact{' '}
            <a href="mailto:support@ledgerlink.com" className="text-primary-600 hover:text-primary-700">
              support@ledgerlink.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};