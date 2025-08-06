# Complete Notification System Setup Guide

This guide will help you set up a complete notification system with Firebase Cloud Messaging (FCM), MongoDB storage, and user authentication.

## Prerequisites

1. A Firebase project with Cloud Messaging enabled
2. Firebase Admin SDK service account credentials
3. MongoDB database (local or cloud)
4. Node.js and npm

## Setup Steps

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Cloud Messaging in the project settings

### 2. Get Firebase Admin SDK Credentials

1. In Firebase Console, go to Project Settings
2. Navigate to the "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file containing your service account credentials

### 3. MongoDB Setup

1. Install MongoDB locally or use MongoDB Atlas (cloud)
2. Create a database named `notification-system`

### 4. Environment Variables Setup

Copy the content from `env-example.txt` to your `.env.local` file and update the values:

```env
# FCM Tokens (comma-separated)
FCM_TOKEN=token1,token2,token3

# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/notification-system

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Notification System Secret Key
NOTIFICATION_SECRET=your-notification-secret-key-change-this

# Public secret key for client-side (same as NOTIFICATION_SECRET)
NEXT_PUBLIC_NOTIFICATION_SECRET=your-notification-secret-key-change-this
```

**Important Notes:**
- Replace the values with your actual Firebase project credentials
- The `FIREBASE_PRIVATE_KEY` should be the entire private key including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts
- Make sure to wrap the private key in quotes and escape newlines with `\n`
- Change the secret keys to secure values in production

### 5. Setup Initial User

Run the setup script to create the initial admin user:

```bash
node scripts/setup-user.js
```

This will create a user with:
- Username: `admin`
- Password: `admin123`

### 6. Getting FCM Tokens

To get FCM tokens from your mobile app or web app:

**For Web Apps:**
```javascript
import { getMessaging, getToken } from "firebase/messaging";

const messaging = getMessaging();
const token = await getToken(messaging, {
  vapidKey: 'your-vapid-key'
});
console.log('FCM Token:', token);
```

**For Mobile Apps:**
- iOS: Use the Firebase iOS SDK to get the FCM token
- Android: Use the Firebase Android SDK to get the FCM token

### 7. Testing the Setup

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. You'll be redirected to the login page

4. Login with:
   - Username: `admin`
   - Password: `admin123`

5. You'll be taken to the dashboard where you can:
   - Send notifications
   - View notification history
   - See success/failure statistics

## Features

### Authentication
- JWT-based authentication
- Secure login system
- Token stored in localStorage
- Automatic logout on token expiration

### Dashboard
- Send notifications with title and message
- View all sent notifications with pagination
- See success/failure counts for each notification
- User-friendly interface

### API Endpoints

#### Authentication
- **POST** `/api/auth/login` - User login

#### Notifications
- **POST** `/api/send-notification` - Send notification (requires auth)
- **GET** `/api/notifications` - Get notification history (requires auth)

**Required Headers for API calls:**
```
Authorization: Bearer <jwt-token>
x-secret-key: <your-notification-secret>
```

## Security Features

1. **Secret Key Protection**: All API endpoints require a secret key
2. **JWT Authentication**: Secure token-based authentication
3. **Password Hashing**: Passwords are hashed using bcrypt
4. **Input Validation**: All inputs are validated and sanitized

## Troubleshooting

### Common Issues:

1. **"No FCM tokens found"**: Make sure your `FCM_TOKEN` environment variable is set correctly
2. **"Invalid private key"**: Ensure the private key is properly formatted with escaped newlines
3. **"Project not found"**: Verify your `FIREBASE_PROJECT_ID` is correct
4. **"Permission denied"**: Make sure your service account has the necessary permissions
5. **"MongoDB connection failed"**: Check your MongoDB URI and ensure the database is running
6. **"Authentication required"**: Make sure you're logged in and the JWT token is valid

### Debug Information:

The API will log the following information to help with debugging:
- Number of successfully sent messages
- Number of failed messages
- List of failed tokens (if any)
- Authentication errors
- Database connection issues

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  password: String (hashed),
  role: String,
  createdAt: Date
}
```

### Notifications Collection
```javascript
{
  _id: ObjectId,
  title: String,
  body: String,
  data: Object,
  sentBy: String (user ID),
  sentByUsername: String,
  fcmTokens: Array,
  results: Array,
  successCount: Number,
  failureCount: Number,
  createdAt: Date,
  status: String
}
``` 