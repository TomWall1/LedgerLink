/**
 * Accept Invite Page - UPDATED
 * Handles counterparty invitation acceptance flow with ERP contact linkage
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ERPContactSelector } from '../components/ERPContactSelector';

interface InvitationDetails {
  inviterName: string;
  inviterEmail: string;
  inviterCompany: string;
  recipientName: string;
  message: string;
  expiresAt: string;
  isExpired: boolean;
}

type AcceptanceStep = 'viewing' | 'selecting-contact' | 'accepting' | 'success';

export const AcceptInvite: React.FC = () => {
  const { token: paramToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  // Extract token from URL if useParams doesn't work (when component is rendered outside Routes)
  const token = paramToken || window.location.pathname.split('/').pop() || '';
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<AcceptanceStep>('viewing');
  
  // Store selected ERP contact info
  const [selectedErpConnectionId, setSelectedErpConnectionId] = useState<string | null>(null);
  const [selectedErpContactId, setSelectedErpContactId] = useState<string | null>(null);

  // Fetch invitation details on mount
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token || token.length < 10) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        console.log(`📧 Fetching invitation details for token: ${token}`);
        
        // Call the backend API
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/counterparty/invite/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ API error:', errorData);
          setError(errorData.message || 'This invitation link is invalid or has expired.');
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('✅ Invitation data received:', data);
        
        if (data.success && data.invitation) {
          setInvitation(data.invitation);
        } else {
          setError('Failed to load invitation details.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching invitation:', err);
        setError('Failed to load invitation details. Please try again or contact support.');
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token]);

  const handleInitialAccept = () => {
    // Check if user is logged in
    const authToken = localStorage.getItem('token');
    
    if (!authToken) {
      // Redirect to login/register with invitation code
      navigate(`/register?flow=invite-acceptance&code=${token}`);
      return;
    }
    
    // User is logged in, proceed to ERP contact selection
    setStep('selecting-contact');
  };

  const handleERPContactSelected = async (erpConnectionId: string, erpContactId: string) => {
    setSelectedErpConnectionId(erpConnectionId);
    setSelectedErpContactId(erpContactId);
    
    // Proceed with acceptance
    await handleFinalAccept(erpConnectionId, erpContactId);
  };

  const handleFinalAccept = async (erpConnectionId: string, erpContactId: string) => {
    setStep('accepting');
    
    try {
      console.log('✅ Accepting invitation with ERP contact:', {
        inviteCode: token,
        recipientErpConnectionId: erpConnectionId,
        recipientErpContactId: erpContactId
      });
      
      const authToken = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/counterparty/invite/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inviteCode: token,
          recipientErpConnectionId: erpConnectionId,
          recipientErpContactId: erpContactId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invitation');
      }
      
      const data = await response.json();
      console.log('✅ Invitation accepted successfully:', data);
      
      setStep('success');
      
      // Redirect to counterparties page after 3 seconds
      setTimeout(() => {
        navigate('/counterparties');
      }, 3000);
      
    } catch (err: any) {
      console.error('❌ Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation. Please try again.');
      setStep('viewing');
    }
  };

  const handleDecline = () => {
    // TODO: Implement decline logic
    console.log('❌ Invitation declined');
    navigate('/');
  };

  const handleCancelSelection = () => {
    setStep('viewing');
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
  if (error && !invitation) {
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
            {error}
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
  if (step === 'success') {
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
          <p className="text-neutral-600 mb-4">
            You're now connected with {invitation?.inviterCompany}
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            Redirecting to your counterparties page...
          </p>
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Accepting state
  if (step === 'accepting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Accepting Invitation...
          </h2>
          <p className="text-neutral-600">
            Creating connection with {invitation?.inviterCompany}
          </p>
        </div>
      </div>
    );
  }

  // ERP Contact Selection step
  if (step === 'selecting-contact') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <ERPContactSelector
              inviteCode={token}
              onContactSelected={handleERPContactSelected}
              onCancel={handleCancelSelection}
            />
          </div>
        </div>
      </div>
    );
  }

  // Main invitation display (viewing step)
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
            {invitation?.inviterName} wants to connect with you
          </p>
        </div>

        {/* Invitation Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          {/* Inviter Info */}
          <div className="flex items-start mb-6 pb-6 border-b border-neutral-200">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 font-semibold text-lg">
                {invitation?.inviterName.charAt(0)}
              </span>
            </div>
            <div className="ml-4 flex-grow">
              <h3 className="font-semibold text-neutral-900">
                {invitation?.inviterName}
              </h3>
              <p className="text-sm text-neutral-600">
                {invitation?.inviterEmail}
              </p>
              <p className="text-sm text-neutral-500">
                {invitation?.inviterCompany}
              </p>
            </div>
          </div>

          {/* Recipient Info */}
          {invitation?.recipientName && (
            <div className="mb-6">
              <p className="text-sm text-neutral-500 mb-1">Invited as:</p>
              <p className="font-medium text-neutral-900">{invitation.recipientName}</p>
            </div>
          )}

          {/* Personal Message */}
          {invitation?.message && (
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

          {/* Error message if any */}
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-error-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-error-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Expiration Notice */}
          {!invitation?.isExpired && invitation?.expiresAt && (
            <div className="text-sm text-neutral-500 text-center mb-6">
              This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleDecline}
              disabled={step !== 'viewing'}
              className="flex-1 bg-neutral-100 text-neutral-700 py-3 px-6 rounded-lg font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Decline
            </button>
            <button
              onClick={handleInitialAccept}
              disabled={invitation?.isExpired || step !== 'viewing'}
              className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept Invitation
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-neutral-500">
          <p>Questions? Reply to the invitation email or contact {invitation?.inviterEmail}</p>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
