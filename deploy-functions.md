# Firebase Functions Deployment Guide

## Prerequisites
1. Make sure you have Firebase CLI installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Make sure you're logged into Firebase:
   ```bash
   firebase login
   ```

3. Make sure you're in the correct project:
   ```bash
   firebase use your-project-id
   ```

## Deploy Functions

1. Navigate to the functions directory:
   ```bash
   cd hpapp/functions
   ```

2. Deploy the functions:
   ```bash
   firebase deploy --only functions
   ```

   Or deploy from the root directory:
   ```bash
   firebase deploy --only functions
   ```

## Functions Created

The following Firebase Cloud Functions have been created:

1. **sendOTP** - Sends OTP via WhatsApp (requires authentication)
2. **verifyOTP** - Verifies OTP (requires authentication)
3. **sendPasswordResetOTP** - Sends password reset OTP via WhatsApp (no auth required)
4. **resetPasswordWithOTP** - Resets password using OTP verification (no auth required)

## Configuration

The WhatsApp API configuration is set in the `index.js` file:

```javascript
const WHATSAPP_CONFIG = {
  accessToken: "YOUR_ACCESS_TOKEN",
  phoneNumberId: "YOUR_PHONE_NUMBER_ID",
  apiUrl: "https://graph.facebook.com/v22.0",
  templateName: "first_vihar_template"
};
```

## Testing

After deployment, you can test the functions using the Firebase Console or by calling them from your frontend application.

## Security Rules

Make sure your Firestore security rules allow the functions to read/write to the `otps` collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /otps/{phoneNumber} {
      allow read, write: if request.auth != null || request.auth == null; // Functions can access
    }
  }
}
```

## Environment Variables (Optional)

For better security, you can move the WhatsApp configuration to environment variables:

1. Set environment variables:
   ```bash
   firebase functions:config:set whatsapp.access_token="YOUR_ACCESS_TOKEN"
   firebase functions:config:set whatsapp.phone_number_id="YOUR_PHONE_NUMBER_ID"
   ```

2. Update the code to use config:
   ```javascript
   const functions = require('firebase-functions');
   const config = functions.config();
   
   const WHATSAPP_CONFIG = {
     accessToken: config.whatsapp.access_token,
     phoneNumberId: config.whatsapp.phone_number_id,
     apiUrl: "https://graph.facebook.com/v22.0",
     templateName: "first_vihar_template"
   };
   ```
