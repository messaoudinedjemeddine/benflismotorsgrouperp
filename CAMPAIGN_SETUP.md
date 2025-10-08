# Campaign Setup Guide

This guide explains how to set up email and WhatsApp campaign functionality for the Benflis ERP system.

## Current Implementation

The campaign system is now fully functional with the following features:

### ✅ What's Working Now

1. **Campaign Creation**: Create campaigns with Excel files and select resellers
2. **Communication Types**: Choose between Email, WhatsApp, or Both
3. **Fallback System**: If no external services are configured, the system will:
   - Open email clients with pre-filled messages for email campaigns
   - Open WhatsApp Web with pre-filled messages for WhatsApp campaigns
4. **Database Integration**: All campaigns are stored in the database with full tracking

### 🔧 Optional: External Service Integration

To enable automatic sending (without manual intervention), you can configure external services:

#### Email Service Setup (SendGrid Example)

1. **Sign up for SendGrid**:
   - Go to [SendGrid](https://sendgrid.com)
   - Create an account and verify your domain
   - Generate an API key

2. **Configure Supabase Environment Variables**:
   ```bash
   # In your Supabase project dashboard, go to Settings > Edge Functions > Environment Variables
   EMAIL_SERVICE_URL=https://api.sendgrid.com/v3/mail/send
   EMAIL_SERVICE_API_KEY=your_sendgrid_api_key_here
   ```

#### WhatsApp Business API Setup

1. **Set up WhatsApp Business API**:
   - Go to [Meta for Developers](https://developers.facebook.com)
   - Create a WhatsApp Business API app
   - Get your phone number ID and access token

2. **Configure Supabase Environment Variables**:
   ```bash
   # In your Supabase project dashboard, go to Settings > Edge Functions > Environment Variables
   WHATSAPP_SERVICE_URL=https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages
   WHATSAPP_SERVICE_API_KEY=your_whatsapp_business_api_token_here
   ```

## How to Use

### Launching a Campaign

1. **Navigate to Resellers**: Go to `http://localhost:8080/dashboard/resellers`
2. **Click "Launch Campaign"**
3. **Step 1**: Upload Excel file and enter campaign name
4. **Step 2**: Select resellers to include
5. **Step 3**: Choose communication method (Email/WhatsApp/Both)
6. **Launch**: The system will automatically handle sending

### What Happens During Launch

1. **File Upload**: Excel file is uploaded to Supabase Storage
2. **Database Record**: Campaign is created in the database
3. **Message Sending**: 
   - If services are configured: Messages are sent automatically
   - If no services: Email clients and WhatsApp Web open with pre-filled messages
4. **Tracking**: All results are tracked and displayed to the user

## Testing Without External Services

The system works perfectly without external services:

1. **Email Campaigns**: Will open your default email client with pre-filled messages
2. **WhatsApp Campaigns**: Will open WhatsApp Web with pre-filled messages
3. **Both**: Will open both email and WhatsApp with appropriate messages

## Troubleshooting

### Campaign Not Sending
- Check if Supabase Edge Functions are deployed
- Verify environment variables are set correctly
- Check browser console for error messages

### Manual Sending
- If automatic sending fails, the system will provide manual links
- Click the generated links to send messages manually
- All campaign data is preserved in the database

## Database Schema

The campaign system uses these tables:
- `promo_campaigns`: Stores campaign information
- `campaign_resellers`: Links campaigns to resellers
- `resellers`: Reseller contact information

## Security

- All functions require authentication
- Campaign data is stored securely in Supabase
- File uploads are handled through Supabase Storage
- API keys are stored as environment variables (not in code)

