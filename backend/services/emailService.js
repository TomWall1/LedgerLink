/**
 * Email Service using SendGrid
 * Handles sending emails for counterparty invitations and other notifications
 */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key from environment variable
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'ledgermatchapp@gmail.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid initialized successfully');
} else {
  console.warn('⚠️ SENDGRID_API_KEY not found in environment variables');
}

/**
 * Send counterparty invitation email
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.recipientName - Recipient's name
 * @param {string} params.senderName - Name of person sending the invitation
 * @param {string} params.senderEmail - Email of person sending the invitation
 * @param {string} params.senderCompany - Company name of sender
 * @param {string} params.inviteUrl - Full invitation acceptance URL
 * @param {string} params.message - Personal message from sender (optional)
 * @returns {Promise<boolean>} - True if email sent successfully
 */
export async function sendCounterpartyInvitation({
  to,
  recipientName,
  senderName,
  senderEmail,
  senderCompany,
  inviteUrl,
  message
}) {
  try {
    if (!SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    console.log(`📧 Preparing to send invitation email to ${to}`);

    // Create HTML email template
    const htmlContent = createInvitationEmailHTML({
      recipientName,
      senderName,
      senderEmail,
      senderCompany,
      inviteUrl,
      message
    });

    // Create plain text version
    const textContent = createInvitationEmailText({
      recipientName,
      senderEmail,
      senderCompany,
      inviteUrl,
      message
    });

    const msg = {
      to: to,
      from: {
        email: FROM_EMAIL,
        name: 'LedgerLink'
      },
      replyTo: senderEmail,
      subject: `${senderName} invited you to connect on LedgerLink`,
      text: textContent,
      html: htmlContent,
      trackingSettings: {
        clickTracking: {
          enable: true
        },
        openTracking: {
          enable: true
        }
      }
    };

    await sgMail.send(msg);
    
    console.log(`✅ Invitation email sent successfully to ${to}`);
    return true;

  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    
    if (error.response) {
      console.error('SendGrid API Error:', error.response.body);
    }
    
    // Don't throw - we want the invitation to be saved even if email fails
    return false;
  }
}

/**
 * Send invitation reminder email
 * @param {Object} params - Email parameters
 * @returns {Promise<boolean>} - True if email sent successfully
 */
export async function sendInvitationReminder({
  to,
  recipientName,
  senderName,
  senderEmail,
  senderCompany,
  inviteUrl,
  originalMessage
}) {
  try {
    if (!SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    console.log(`📧 Preparing to send reminder email to ${to}`);

    // Create HTML email template for reminder
    const htmlContent = createReminderEmailHTML({
      recipientName,
      senderName,
      senderEmail,
      senderCompany,
      inviteUrl,
      originalMessage
    });

    // Create plain text version
    const textContent = createReminderEmailText({
      recipientName,
      senderName,
      senderEmail,
      senderCompany,
      inviteUrl,
      originalMessage
    });

    const msg = {
      to: to,
      from: {
        email: FROM_EMAIL,
        name: 'LedgerLink'
      },
      replyTo: senderEmail,
      subject: `Reminder: ${senderName} is waiting for you to connect on LedgerLink`,
      text: textContent,
      html: htmlContent
    };

    await sgMail.send(msg);
    
    console.log(`✅ Reminder email sent successfully to ${to}`);
    return true;

  } catch (error) {
    console.error('❌ Error sending reminder email:', error);
    
    if (error.response) {
      console.error('SendGrid API Error:', error.response.body);
    }
    
    return false;
  }
}

/**
 * Create HTML content for invitation email
 */
function createInvitationEmailHTML({
  recipientName,
  senderName,
  senderEmail,
  senderCompany,
  inviteUrl,
  message
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LedgerLink Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1B365D 0%, #00A4B4 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">LedgerLink</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Streamline Your Invoice Reconciliation</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1B365D; font-size: 24px; font-weight: 600;">
                You've been invited to connect!
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hi ${recipientName},
              </p>
              
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                <strong>${senderName}</strong> from <strong>${senderCompany}</strong> has invited you to connect your accounting systems on LedgerLink.
              </p>

              ${message ? `
              <div style="background-color: #f8fafc; border-left: 4px solid #00A4B4; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
                <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6; font-style: italic;">
                  "${message}"
                </p>
              </div>
              ` : ''}

              <div style="background-color: #f8fafc; padding: 25px; margin: 0 0 30px; border-radius: 6px;">
                <h3 style="margin: 0 0 15px; color: #1B365D; font-size: 18px; font-weight: 600;">
                  Why connect?
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 1.8;">
                  <li>Automatic invoice matching and reconciliation</li>
                  <li>Real-time visibility into shared transactions</li>
                  <li>Faster dispute resolution</li>
                  <li>Reduced manual data entry and errors</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 16px 48px; background-color: #00A4B4; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,164,180,0.2);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px; color: #718096; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px; color: #00A4B4; font-size: 14px; word-break: break-all;">
                ${inviteUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

              <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Have questions? Reply to this email or contact ${senderName} at 
                <a href="mailto:${senderEmail}" style="color: #00A4B4; text-decoration: none;">${senderEmail}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #718096; font-size: 13px;">
                This invitation was sent by ${senderName} (${senderEmail})
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                © ${new Date().getFullYear()} LedgerLink. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Create plain text content for invitation email
 */
function createInvitationEmailText({
  recipientName,
  senderName,
  senderEmail,
  senderCompany,
  inviteUrl,
  message
}) {
  return `
Hi ${recipientName},

${senderName} from ${senderCompany} has invited you to connect your accounting systems on LedgerLink.

${message ? `Personal message from ${senderName}:\n"${message}"\n\n` : ''}

WHY CONNECT?
- Automatic invoice matching and reconciliation
- Real-time visibility into shared transactions
- Faster dispute resolution
- Reduced manual data entry and errors

ACCEPT INVITATION:
${inviteUrl}

Have questions? Reply to this email or contact ${senderName} at ${senderEmail}

---
This invitation was sent by ${senderName} (${senderEmail})
© ${new Date().getFullYear()} LedgerLink. All rights reserved.
  `.trim();
}

/**
 * Create HTML content for reminder email
 */
function createReminderEmailHTML({
  recipientName,
  senderName,
  senderEmail,
  senderCompany,
  inviteUrl,
  originalMessage
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LedgerLink Invitation Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1B365D 0%, #00A4B4 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">LedgerLink</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Invitation Reminder</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1B365D; font-size: 24px; font-weight: 600;">
                Reminder: Connect with ${senderName}
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hi ${recipientName},
              </p>
              
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                This is a friendly reminder that <strong>${senderName}</strong> from <strong>${senderCompany}</strong> is waiting for you to accept their LedgerLink invitation.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 16px 48px; background-color: #00A4B4; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,164,180,0.2);">
                      Accept Invitation Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px; color: #718096; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link:
              </p>
              <p style="margin: 0 0 30px; color: #00A4B4; font-size: 14px; word-break: break-all;">
                ${inviteUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

              <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Questions? Contact ${senderName} at 
                <a href="mailto:${senderEmail}" style="color: #00A4B4; text-decoration: none;">${senderEmail}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                © ${new Date().getFullYear()} LedgerLink. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Create plain text content for reminder email
 */
function createReminderEmailText({
  recipientName,
  senderName,
  senderEmail,
  senderCompany,
  inviteUrl,
  originalMessage
}) {
  return `
Hi ${recipientName},

This is a friendly reminder that ${senderName} from ${senderCompany} is waiting for you to accept their LedgerLink invitation.

ACCEPT INVITATION:
${inviteUrl}

Questions? Contact ${senderName} at ${senderEmail}

---
© ${new Date().getFullYear()} LedgerLink. All rights reserved.
  `.trim();
}

export default {
  sendCounterpartyInvitation,
  sendInvitationReminder
};
