/**
 * Accept Invite Page
 * Handles counterparty invitation acceptance flow
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface InvitationDetails {
  inviterName: string;
  inviterEmail: string;
  inviterCompany: string;
  recipientName: string;
  message: string;
  expiresAt: string;
  isExpired: boolean;
}

export const AcceptInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch invitation details on mount
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        console.log(`📧 Fetching invitation details for token: ${token}`);
        
        // TODO: Replace with actual API endpoint when backend is ready
        // For now, show a coming soon message
        
        // Simulated data for demonstration
        setInvitation({
          inviterName: 'Thomas Wall',
          inviterEmail: 'thomasjameswall1@gmail.com',
          inviterCompany: 'Your Company',
          recipientName: 'Hooli',
          message: "Hi Hooli,\n\nI'd like to connect our accounting systems to streamline our invoice reconciliation process. This will help us both save time and reduce errors.\n\nLooking forward to working together!",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isExpired: false
        });
        
        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching invitation:', err);
        setError('Failed to load invitation details. Please try again or contact support.');
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      console.log('✅ Accepting invitation...');
      
      // TODO: Implement actual acceptance logic
      // This will involve:
      // 1. Creating/logging in the user
      // 2. Connecting their accounting system
      // 3. Updating invitation status to ACCEPTED
      
      // For now, show success message
      setSuccess(true);
      
      // Redirect to registration/login after 3 seconds
      setTimeout(() => {
        navigate('/register?flow=invite-acceptance&token=' + token);
      }, 3000);
      
    } catch (err) {
      console.error('❌ Error accepting invitation:', err);
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    // TODO: Implement decline logic
    console.log('❌ Invitation declined');
    navigate('/');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Invalid Invitation
          </h2>
          <p className="text-neutral-600 mb-6">
            {error || 'This invitation link is invalid or has expired.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Invitation Accepted!
          </h2>
          <p className="text-neutral-600 mb-6">
            Redirecting you to complete your account setup...
          </p>
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Main invitation display
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full p-4 shadow-lg mb-4">
            <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            You've been invited to LedgerLink
          </h1>
          <p className="text-neutral-600">
            {invitation.inviterName} wants to connect with you
          </p>
        </div>

        {/* Invitation Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          {/* Inviter Info */}
          <div className="flex items-start mb-6 pb-6 border-b border-neutral-200">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 font-semibold text-lg">
                {invitation.inviterName.charAt(0)}
              </span>
            </div>
            <div className="ml-4 flex-grow">
              <h3 className="font-semibold text-neutral-900">
                {invitation.inviterName}
              </h3>
              <p className="text-sm text-neutral-600">
                {invitation.inviterEmail}
              </p>
              <p className="text-sm text-neutral-500">
                {invitation.inviterCompany}
              </p>
            </div>
          </div>

          {/* Recipient Info */}
          <div className="mb-6">
            <p className="text-sm text-neutral-500 mb-1">Invited as:</p>
            <p className="font-medium text-neutral-900">{invitation.recipientName}</p>
          </div>

          {/* Personal Message */}
          {invitation.message && (
            <div className="bg-neutral-50 border-l-4 border-secondary-500 p-4 rounded-r-lg mb-6">
              <p className="text-sm font-medium text-neutral-700 mb-2">Personal message:</p>
              <p className="text-neutral-600 whitespace-pre-wrap">
                {invitation.message}
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold text-neutral-900 mb-4">
              Why connect with LedgerLink?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">Automatic invoice matching and reconciliation</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">Real-time visibility into shared transactions</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">Faster dispute resolution</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">Reduced manual data entry and errors</span>
              </li>
            </ul>
          </div>

          {/* Expiration Notice */}
          {!invitation.isExpired && (
            <div className="text-sm text-neutral-500 text-center mb-6">
              This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleDecline}
              disabled={accepting}
              className="flex-1 bg-neutral-100 text-neutral-700 py-3 px-6 rounded-lg font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={accepting || invitation.isExpired}
              className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {accepting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Accepting...
                </>
              ) : (
                'Accept Invitation'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-neutral-500">
          <p>Questions? Reply to the invitation email or contact {invitation.inviterEmail}</p>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
