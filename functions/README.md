# Synaphack Email Functionality

This directory contains Firebase Cloud Functions for handling email functionality in the Synaphack platform using Gmail SMTP.

## Features

- **Welcome Emails**: Automatically sent when new users register
- **Team Invitations**: Sent when participants are invited to join a team
- **Judge Invitations**: Sent when judges are invited to evaluate submissions
- **Submission Confirmations**: Sent when participants submit their projects
- **Event Announcements**: Bulk emails for important event updates
- **Winner Announcements**: Congratulatory emails to winning teams

## Setup Instructions

### 1. Install Dependencies

From the `functions` directory, run:

```bash
npm install
```

### 2. Set Up Gmail SMTP

1. Use a Gmail account for sending emails
2. Enable 2-Factor Authentication (2FA) on your Gmail account
   - Go to your Google Account > Security > 2-Step Verification
3. Create an App Password
   - Go to your Google Account > Security > App passwords
   - Select "Mail" as the app and "Other" as the device
   - Enter a name (e.g., "Synaphack Platform")
   - Click "Generate" to get your 16-character app password

### 3. Configure Firebase with Gmail Credentials

Run the following commands to securely store your Gmail credentials:

```bash
firebase functions:config:set gmail.email="your-gmail-address@gmail.com"
firebase functions:config:set gmail.pass="your-16-character-app-password"
firebase functions:config:set app.url="https://your-app-url.com"
```

### 4. Deploy Functions

Deploy the functions to Firebase:

```bash
firebase deploy --only functions
```

## Email Templates

The functions include HTML templates for various email types:

- Welcome emails
- Team formation invitations
- Judge invitations
- Submission confirmations
- Event announcements
- Winner announcements

You can customize these templates by modifying the HTML in the respective functions.

## Testing Locally

To test the functions locally:

1. Download your Firebase service account key
2. Set up environment variables for local testing with your Gmail credentials:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
firebase functions:config:get > .runtimeconfig.json
```

3. Run the Firebase emulator:

```bash
firebase emulators:start --only functions
```

## Troubleshooting

- Check Firebase Functions logs for any errors
- Verify your Gmail credentials are correctly set in Firebase config
- Ensure 2FA is enabled and the App Password is correctly generated
- Be aware of Gmail's sending limits (~500 emails/day per account)
- If emails aren't being sent, check your Gmail account for any security alerts
- For production use with higher volume, consider upgrading to a paid email service