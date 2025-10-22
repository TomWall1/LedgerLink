# Email Setup Guide - SendGrid Integration

This guide will help you set up real email sending for LedgerLink's counterparty invitation system using SendGrid.

## Overview

LedgerLink uses SendGrid to send:
- **Invitation emails** - When you invite a counterparty to connect
- **Acceptance notifications** - When a counterparty accepts your invitation
- **Rejection notifications** - When a counterparty declines your invitation

## Prerequisites

- A SendGrid account (free tier works fine for testing)
- Access to your Render backend environment variables

---

## Step 1: Create a SendGrid Account

1. Go to [SendGrid.com](https://sendgrid.com)
2. Click **"Start for Free"** (no credit card required)
3. Complete the signup process
4. Verify your email address

### Free Tier Limits
- **100 emails/day** - Perfect for testing and early usage
- All features included
- No credit card required

---

## Step 2: Verify Your Sender Email

SendGrid requires you to verify the email address you'll send from.

### Option A: Single Sender Verification (Easiest)

1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Click **"Get Started"** under **Single Sender Verification**
3. Fill in your details:
   - **From Name:** `LedgerLink`
   - **From Email Address:** Your business email (e.g., `noreply@yourdomain.com`)
   - **Reply To:** Your support email (e.g., `support@yourdomain.com`)
   - **Company Address:** Your business address
4. Click **"Create"**
5. Check your inbox and click the verification link
6. Wait for verification (usually instant)

### Option B: Domain Authentication (Recommended for Production)

If you own a domain, this is more professional:

1. Go to **Settings** → **Sender Authentication**
2. Click **"Get Started"** under **Authenticate Your Domain**
3. Select your DNS provider (e.g., Cloudflare, GoDaddy)
4. Follow the instructions to add DNS records
5. Wait for verification (can take up to 48 hours)

**Benefits:**
- More professional appearance
- Better deliverability
- Can send from any address @yourdomain.com

---

## Step 3: Generate an API Key

1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name it: `LedgerLink Production`
4. Choose **"Restricted Access"**
5. Grant these permissions:
   - **Mail Send** → Full Access
   - Everything else can stay "No Access"
6. Click **"Create & View"**
7. **IMPORTANT:** Copy the API key now - you won't be able to see it again!

The API key looks like:
```
SG.xxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 4: Add API Key to Render

Now add the SendGrid API key to your backend on Render:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your **ledgerlink-backend** service
3. Go to **Environment** tab
4. Add a new environment variable:
   - **Key:** `SENDGRID_API_KEY`
   - **Value:** Paste your API key from Step 3
5. Click **"Save Changes"**

### Additional Email Settings (Optional)

You can also add these environment variables:

```bash
FROM_EMAIL=noreply@yourdomain.com    # Must match verified sender
FROM_NAME=LedgerLink                  # Display name in emails
FRONTEND_URL=https://ledgerlink.vercel.app  # For invitation links
```

If you don't add these, the defaults will be used:
- FROM_EMAIL: `noreply@ledgerlink.app`
- FROM_NAME: `LedgerLink`
- FRONTEND_URL: `https://ledgerlink.vercel.app`

---

## Step 5: Deploy and Test

After adding the environment variables, Render will automatically redeploy your backend.

### Wait for Deployment
1. In Render dashboard, watch the deployment log
2. Look for: `✅ SendGrid email service initialized`
3. Wait until status shows "Live"

### Test Email Sending

1. Go to your frontend: https://ledgerlink.vercel.app
2. Navigate to **Counterparties** page
3. Click **"Invite Counterparty"**
4. Fill in the form with a real email address you can access
5. Click **"Send Invitation"**
6. Check the inbox for the test email

**Expected Result:**
- Professional HTML email with invitation code
- Branded with LedgerLink styling
- Working "Accept Invitation" button

---

## Troubleshooting

### Email Not Received?

**Check 1: Spam Folder**
- SendGrid emails may initially go to spam
- Mark as "Not Spam" to train email filters

**Check 2: Verify API Key is Set**
1. Go to Render → Your Service → Environment
2. Confirm `SENDGRID_API_KEY` is present
3. Make sure there are no extra spaces

**Check 3: Check Backend Logs**
1. In Render, go to **Logs** tab
2. Look for:
   ```
   ✅ Email sent to user@example.com: Subject line
   ```
   Or errors like:
   ```
   ❌ SendGrid error: ...
   ```

**Check 4: Verify Sender Email**
- Make sure the email in `FROM_EMAIL` matches your verified sender in SendGrid
- Go to SendGrid → Settings → Sender Authentication
- Confirm status is "Verified" ✓

### Common Errors

**Error: "The from email does not contain a valid address"**
- Solution: Your FROM_EMAIL isn't verified in SendGrid
- Go to Step 2 and verify your sender email

**Error: "Forbidden"**
- Solution: Your API key doesn't have Mail Send permission
- Generate a new API key with correct permissions (Step 3)

**Error: "Unauthorized"**
- Solution: API key is incorrect or missing
- Double-check you copied the entire API key
- Regenerate if needed

---

## Development vs Production

### Development Mode (No API Key)
When `SENDGRID_API_KEY` is not set:
- Emails are printed to console/logs
- Useful for testing without sending real emails
- You'll see the full email content in backend logs

### Production Mode (With API Key)
When `SENDGRID_API_KEY` is set:
- Emails are actually sent via SendGrid
- Recipients receive real emails
- Tracked in SendGrid dashboard

---

## Monitoring Email Delivery

### SendGrid Dashboard

1. Go to SendGrid → **Activity**
2. See all sent emails and their status:
   - ✅ **Delivered** - Email reached inbox
   - 📭 **Opened** - Recipient opened the email
   - 🖱️ **Clicked** - Recipient clicked a link
   - ❌ **Bounced** - Email address invalid
   - 🚫 **Blocked** - Marked as spam

### Email Metrics
- Track invitation acceptance rates
- See which emails are being opened
- Identify delivery issues

---

## Email Templates

LedgerLink sends three types of emails:

### 1. Invitation Email
**When sent:** When you invite a counterparty
**Contains:**
- Company name and personal message
- Unique invitation code
- Step-by-step acceptance instructions
- "Accept Invitation" button
- Security information

### 2. Acceptance Notification
**When sent:** When counterparty accepts invitation
**Contains:**
- Confirmation of connection
- Link to view counterparty
- Next steps information

### 3. Rejection Notification
**When sent:** When counterparty declines invitation
**Contains:**
- Notification of decline
- Suggestion to contact directly

---

## Upgrading SendGrid Plan

If you need to send more emails:

| Plan | Emails/Month | Price |
|------|--------------|-------|
| Free | ~3,000 | $0 |
| Essentials | 50,000 | $19.95/mo |
| Pro | 100,000 | $89.95/mo |

**When to upgrade:**
- Sending 100+ invitations per day
- Need dedicated IP address
- Want advanced analytics

---

## Security Best Practices

### Protect Your API Key
- ✅ Store in Render environment variables only
- ✅ Never commit to Git
- ✅ Regenerate if accidentally exposed
- ❌ Don't share in emails or Slack

### Sender Reputation
- Don't send to invalid emails
- Keep bounce rates low
- Include unsubscribe links (not needed for invitations)
- Monitor spam complaints in SendGrid

---

## Alternative Email Providers

If you prefer not to use SendGrid, the code can easily be adapted for:

- **AWS SES** - Cheaper at scale, requires AWS account
- **Mailgun** - Similar to SendGrid
- **Postmark** - Excellent deliverability
- **SMTP** - Use any email provider

The email service is located at:
```
backend/src/utils/emailService.js
```

---

## Need Help?

### SendGrid Resources
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid Support](https://support.sendgrid.com/)
- [API Key Guide](https://docs.sendgrid.com/ui/account-and-settings/api-keys)

### LedgerLink Issues
- Check backend logs in Render
- Review counterpartyRoutes.js for invitation logic
- Test with development mode first (no API key)

---

## Summary Checklist

Before going live, verify:

- [ ] SendGrid account created
- [ ] Sender email verified (or domain authenticated)
- [ ] API key generated with Mail Send permission
- [ ] `SENDGRID_API_KEY` added to Render environment
- [ ] Backend redeployed successfully
- [ ] Test invitation sent and received
- [ ] Email appears professional (not in spam)
- [ ] Accept invitation link works

---

**Status Check:**
- ✅ Email service: Implemented
- ✅ Professional templates: Ready
- ⏳ SendGrid setup: **← You are here**
- ⏳ Testing: After setup

**Once setup is complete, counterparty invitations will be delivered via professional, branded emails!**
