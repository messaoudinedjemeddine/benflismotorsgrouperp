# Campaign Functions

This directory contains Supabase Edge Functions for handling email and WhatsApp campaigns.

## Functions

### send-campaign
Main function that handles both email and WhatsApp campaigns based on the communication type.

### send-email-campaign
Dedicated function for email-only campaigns.

### send-whatsapp-campaign
Dedicated function for WhatsApp-only campaigns.

## Environment Variables

To enable automatic email and WhatsApp sending, configure the following environment variables in your Supabase project:

### Email Service (Optional)
```
EMAIL_SERVICE_URL=https://api.sendgrid.com/v3/mail/send
EMAIL_SERVICE_API_KEY=your_sendgrid_api_key
```

### WhatsApp Service (Optional)
```
WHATSAPP_SERVICE_URL=https://graph.facebook.com/v18.0/your_phone_number_id/messages
WHATSAPP_SERVICE_API_KEY=your_whatsapp_business_api_token
```

## Fallback Behavior

If no email or WhatsApp service is configured, the functions will:

1. **Email**: Generate `mailto:` links that open the user's default email client
2. **WhatsApp**: Generate WhatsApp Web links that open WhatsApp in the browser

## Setup Instructions

1. Deploy the functions to your Supabase project:
   ```bash
   supabase functions deploy send-campaign
   supabase functions deploy send-email-campaign
   supabase functions deploy send-whatsapp-campaign
   ```

2. (Optional) Configure email service:
   - Sign up for SendGrid, Mailgun, or similar service
   - Add the service URL and API key to your Supabase project environment variables

3. (Optional) Configure WhatsApp Business API:
   - Set up WhatsApp Business API through Meta
   - Add the API URL and token to your Supabase project environment variables

## Usage

The functions are automatically called when launching campaigns from the Resellers page. The system will:

1. Create the campaign record in the database
2. Upload the Excel file to Supabase Storage
3. Call the appropriate function to send messages
4. Handle both automatic sending (if services configured) and manual fallback

## Manual Sending

If no services are configured, the system will:
- Open email clients with pre-filled messages for email campaigns
- Open WhatsApp Web with pre-filled messages for WhatsApp campaigns
- Allow users to review and send messages manually

