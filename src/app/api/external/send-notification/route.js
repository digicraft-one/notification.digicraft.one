import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import clientPromise from '@/lib/mongodb';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
}

export async function POST(request) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.NEXT_PUBLIC_NOTIFICATION_SECRET) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const { title, body, data, tokens, sender } = await request.json();
    
    // Validate required fields
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get FCM tokens from environment variable (primary) or request body (optional override)
    let fcmTokens = process.env.FCM_TOKEN?.split(',').map(token => token.trim()) || [];
    
    // If specific tokens are provided in request, use them instead
    if (tokens && Array.isArray(tokens) && tokens.length > 0) {
      fcmTokens = tokens;
      console.log(`Using ${fcmTokens.length} tokens from request body`);
    } else {
      console.log(`Using ${fcmTokens.length} tokens from environment variable`);
    }
    
    if (fcmTokens.length === 0) {
      return NextResponse.json(
        { error: 'No FCM tokens found. Set FCM_TOKEN environment variable or provide tokens in request body.' },
        { status: 400 }
      );
    }

    // Get the messaging instance
    const messaging = admin.messaging();
    
    // Send notifications to each token individually
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const token of fcmTokens) {
      try {
        const message = {
          notification: {
            title: title,
            body: body,
          },
          data: data || {},
          token: token,
        };

        const response = await messaging.send(message);
        results.push({ token, success: true, messageId: response });
        successCount++;
        console.log(`Successfully sent message to token: ${token.substring(0, 20)}...`);
      } catch (error) {
        results.push({ token, success: false, error: error.message });
        failureCount++;
        console.error(`Failed to send message to token: ${token.substring(0, 20)}...`, error.message);
      }
    }

    // Save notification to MongoDB
    const client = await clientPromise;
    const db = client.db('notification-system');
    const notificationsCollection = db.collection('notifications');

    const notification = {
      title: title,
      body: body,
      data: data || {},
      sentBy: 'external-api',
      sentByUsername: sender || 'external-application',
      fcmTokens: fcmTokens,
      results: results,
      successCount,
      failureCount,
      createdAt: new Date(),
      status: 'sent',
      source: 'external-api',
      sender: sender || 'Unknown App'
    };

    await notificationsCollection.insertOne(notification);

    return NextResponse.json({
      success: true,
      successCount,
      failureCount,
      results,
      notificationId: notification._id,
      message: `Successfully sent ${successCount} notifications, ${failureCount} failed`
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: error.message },
      { status: 500 }
    );
  }
} 