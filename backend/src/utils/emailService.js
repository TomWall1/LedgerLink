import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ledgerlink.app';
const FROM_NAME = process.env.FROM_NAME || 'LedgerLink';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ledgerlink.vercel.app';

// Initialize SendGrid if API key is provided
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid email service initialized');
} else {
  console.warn('⚠️  SENDGRID_API_KEY not set - emails will be logged to console only');
}

/**
 * Send an email using SendGrid or log to console if not configured
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const emailData = {
    to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject,
    html,
    text
  };

  // If SendGrid is configured, send the email
  if (SENDGRID_API_KEY) {
    try {
      const response = await sgMail.send(emailData);
      console.log(`✅ Email sent to ${to}: ${subject}`);
      return { 
        success: true, 
        messageId: response[0].headers['x-message-id'],
        provider: 'sendgrid'
      };
    } catch (error) {
      console.error('❌ SendGrid error:', error.response?.body || error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  } else {
    // Development mode - log to console
    console.log('\n📧 ========== EMAIL (Development Mode) ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`\n${text}`);
    console.log('================================================\n');
    
    return { 
      success: true, 
      messageId: `dev-${Date.now()}`,
      provider: 'console'
    };
  }
};

/**
 * Send counterparty invitation email
 */
export const sendInvitationEmail = async ({
  to,
  senderCompanyName,
  contactName,
  inviteCode,
  message,
  isReminder = false
}) => {
  const acceptUrl = `${FRONTEND_URL}/accept-invite?code=${inviteCode}`;
  
  const subject = isReminder 
    ? `Reminder: ${senderCompanyName} invitation to connect` 
    : `${senderCompanyName} wants to connect with you on LedgerLink`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #0b3a66 0%, #1464a6 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .logo {
          color: #ffffff;
          font-size: 28px;
          font-weight: bold;
          margin: 0;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          color: #0f172a;
          margin-bottom: 20px;
        }
        .message-box {
          background-color: #f1f5f9;
          border-left: 4px solid #2a8fe6;
          padding: 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .message-label {
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }
        .invite-code-box {
          background: linear-gradient(135deg, #e6eef9 0%, #f1f5f9 100%);
          padding: 30px;
          border-radius: 8px;
          text-align: center;
          margin: 30px 0;
          border: 2px solid #2a8fe6;
        }
        .invite-code-label {
          color: #1464a6;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .invite-code {
          font-size: 32px;
          font-weight: bold;
          color: #0b3a66;
          letter-spacing: 4px;
          font-family: 'Courier New', monospace;
        }
        .steps {
          margin: 30px 0;
        }
        .step {
          display: flex;
          margin-bottom: 15px;
          align-items: flex-start;
        }
        .step-number {
          background-color: #2a8fe6;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          margin-right: 15px;
          flex-shrink: 0;
        }
        .step-text {
          padding-top: 4px;
          color: #475569;
        }
        .cta-button {
          display: inline-block;
          background-color: #2a8fe6;
          color: #ffffff !important;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 30px 0;
          text-align: center;
        }
        .cta-button:hover {
          background-color: #1464a6;
        }
        .footer {
          background-color: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
          border-top: 1px solid #e2e8f0;
        }
        .security-note {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 14px;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo">🔗 LedgerLink</h1>
        </div>
        
        <div class="content">
          <p class="greeting">Hi ${contactName},</p>
          
          <p><strong>${senderCompanyName}</strong> has invited you to connect on LedgerLink for automated invoice reconciliation.</p>
          
          ${message ? `
            <div class="message-box">
              <div class="message-label">Message from ${senderCompanyName}:</div>
              <div>${message.replace(/\n/g, '<br>')}</div>
            </div>
          ` : ''}
          
          ${isReminder ? `
            <div class="security-note">
              ⏰ <strong>Reminder:</strong> This is a follow-up to the invitation sent earlier. 
              The invitation is still waiting for your response.
            </div>
          ` : ''}
          
          <div class="invite-code-box">
            <div class="invite-code-label">Your Invitation Code</div>
            <div class="invite-code">${inviteCode}</div>
          </div>
          
          <div class="steps">
            <p style="font-weight: 600; color: #0f172a; margin-bottom: 20px;">To accept this invitation:</p>
            
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-text">Click the button below or visit <a href="${acceptUrl}">${FRONTEND_URL}</a></div>
            </div>
            
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-text">Sign up or log in to your LedgerLink account</div>
            </div>
            
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-text">Enter the invitation code shown above</div>
            </div>
            
            <div class="step">
              <div class="step-number">4</div>
              <div class="step-text">Connect your accounting system (read-only access)</div>
            </div>
          </div>
          
          <center>
            <a href="${acceptUrl}" class="cta-button">Accept Invitation</a>
          </center>
          
          <div class="security-note">
            🔒 <strong>Privacy & Security:</strong> LedgerLink uses read-only access to your accounting data. 
            No sensitive information is shared between companies. You can disconnect at any time.
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            This invitation will expire in 30 days. If you have any questions, please contact ${senderCompanyName} directly.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;">
            © ${new Date().getFullYear()} LedgerLink - Secure Invoice Reconciliation
          </p>
          <p style="margin: 0; font-size: 12px;">
            Automated reconciliation for modern businesses
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
LedgerLink Connection Invitation

Hi ${contactName},

${senderCompanyName} has invited you to connect on LedgerLink for automated invoice reconciliation.

${message ? `Message from ${senderCompanyName}:\n${message}\n\n` : ''}

Your Invitation Code: ${inviteCode}

To accept this invitation:

1. Visit ${acceptUrl}
2. Sign up or log in to your LedgerLink account
3. Enter the invitation code: ${inviteCode}
4. Connect your accounting system (read-only access)

Privacy & Security: LedgerLink uses read-only access to your accounting data. No sensitive information is shared between companies. You can disconnect at any time.

This invitation will expire in 30 days. If you have any questions, please contact ${senderCompanyName} directly.

---
© ${new Date().getFullYear()} LedgerLink - Secure Invoice Reconciliation
  `.trim();

  return sendEmail({ to, subject, html, text });
};

/**
 * Send invitation accepted notification to sender
 */
export const sendInvitationAcceptedEmail = async ({
  to,
  acceptedByCompanyName,
  contactName
}) => {
  const subject = `${acceptedByCompanyName} accepted your LedgerLink invitation`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .success-box { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .cta-button { display: inline-block; background-color: #2a8fe6; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #94a3b8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Invitation Accepted!</h1>
        </div>
        <div class="content">
          <p>Great news!</p>
          <div class="success-box">
            <p style="margin: 0;"><strong>${acceptedByCompanyName}</strong> has accepted your invitation and connected their accounting system to LedgerLink.</p>
          </div>
          <p>You can now start reconciling invoices automatically with ${contactName}.</p>
          <center>
            <a href="${FRONTEND_URL}/counterparties" class="cta-button">View Connected Counterparties</a>
          </center>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} LedgerLink</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Great news!

${acceptedByCompanyName} has accepted your invitation and connected their accounting system to LedgerLink.

You can now start reconciling invoices automatically with ${contactName}.

Visit ${FRONTEND_URL}/counterparties to view your connected counterparties.

---
© ${new Date().getFullYear()} LedgerLink
  `.trim();

  return sendEmail({ to, subject, html, text });
};

/**
 * Send invitation rejected notification to sender
 */
export const sendInvitationRejectedEmail = async ({
  to,
  rejectedByCompanyName,
  contactName
}) => {
  const subject = `${rejectedByCompanyName} declined your LedgerLink invitation`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 40px 20px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .info-box { background-color: #f1f5f9; border-left: 4px solid #64748b; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #94a3b8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invitation Declined</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <div class="info-box">
            <p style="margin: 0;"><strong>${rejectedByCompanyName}</strong> has declined your invitation to connect on LedgerLink.</p>
          </div>
          <p>You may want to reach out to ${contactName} directly to discuss alternative reconciliation methods.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} LedgerLink</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${rejectedByCompanyName} has declined your invitation to connect on LedgerLink.

You may want to reach out to ${contactName} directly to discuss alternative reconciliation methods.

---
© ${new Date().getFullYear()} LedgerLink
  `.trim();

  return sendEmail({ to, subject, html, text });
};
