// Email service utility for sending counterparty invitations
// This is a placeholder - implement with your preferred email service (SendGrid, AWS SES, etc.)

export const sendInvitationEmail = async ({
  to,
  senderCompanyName,
  contactName,
  inviteCode,
  message,
  isReminder = false
}) => {
  // TODO: Implement actual email sending logic
  // For now, just log the email details
  console.log('Sending invitation email:', {
    to,
    senderCompanyName,
    contactName,
    inviteCode,
    message,
    isReminder,
    subject: isReminder 
      ? `Reminder: ${senderCompanyName} invitation to connect` 
      : `${senderCompanyName} wants to connect with you on LedgerLink`
  });
  
  // Example email content structure:
  const emailContent = {
    subject: isReminder 
      ? `Reminder: ${senderCompanyName} invitation to connect` 
      : `${senderCompanyName} wants to connect with you on LedgerLink`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0b3a66;">LedgerLink Connection Invitation</h2>
        
        <p>Hi ${contactName},</p>
        
        <p><strong>${senderCompanyName}</strong> has invited you to connect on LedgerLink for automated invoice reconciliation.</p>
        
        ${message ? `<p style="background: #f8fafc; padding: 16px; border-left: 4px solid #2a8fe6; margin: 20px 0;">
          <strong>Message from ${senderCompanyName}:</strong><br/>
          ${message}
        </p>` : ''}
        
        <div style="background: #e6eef9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1464a6; margin-top: 0;">Your Invitation Code</h3>
          <p style="font-size: 24px; font-weight: bold; color: #0b3a66; letter-spacing: 2px;">
            ${inviteCode}
          </p>
        </div>
        
        <p>To accept this invitation:</p>
        <ol>
          <li>Visit <a href="${process.env.FRONTEND_URL || 'https://ledgerlink.vercel.app'}/accept-invite?code=${inviteCode}">LedgerLink</a></li>
          <li>Sign up or log in to your account</li>
          <li>Enter the invitation code above</li>
          <li>Connect your accounting system</li>
        </ol>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://ledgerlink.vercel.app'}/accept-invite?code=${inviteCode}" 
             style="background: #2a8fe6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        
        <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
          This invitation will expire in 30 days. If you have any questions, please contact ${senderCompanyName}.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e6eef9; margin: 30px 0;">
        
        <p style="color: #94a3b8; font-size: 12px;">
          © ${new Date().getFullYear()} LedgerLink. Secure invoice reconciliation platform.
        </p>
      </div>
    `,
    text: `
      LedgerLink Connection Invitation
      
      Hi ${contactName},
      
      ${senderCompanyName} has invited you to connect on LedgerLink for automated invoice reconciliation.
      
      ${message ? `Message from ${senderCompanyName}: ${message}` : ''}
      
      Your Invitation Code: ${inviteCode}
      
      To accept this invitation:
      1. Visit ${process.env.FRONTEND_URL || 'https://ledgerlink.vercel.app'}/accept-invite?code=${inviteCode}
      2. Sign up or log in to your account
      3. Enter the invitation code
      4. Connect your accounting system
      
      This invitation will expire in 30 days.
    `
  };
  
  // Return success for now
  return { success: true, messageId: `mock-${Date.now()}` };
};

export const sendInvitationAcceptedEmail = async ({
  to,
  acceptedByCompanyName,
  contactName
}) => {
  console.log('Sending invitation accepted email:', {
    to,
    acceptedByCompanyName,
    contactName
  });
  
  // TODO: Implement actual email sending
  return { success: true };
};

export const sendInvitationRejectedEmail = async ({
  to,
  rejectedByCompanyName,
  contactName
}) => {
  console.log('Sending invitation rejected email:', {
    to,
    rejectedByCompanyName,
    contactName
  });
  
  // TODO: Implement actual email sending
  return { success: true };
};
