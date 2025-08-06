import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import clientPromise from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';

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
    // Authenticate the request
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify secret key
    const secretKey = request.headers.get('x-secret-key');
    if (secretKey !== process.env.NOTIFICATION_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 403 }
      );
    }

    const { title, body, data } = await request.json();
    
    // Get FCM tokens from environment variable
    const fcmTokens = process.env.FCM_TOKEN?.split(',').map(token => token.trim()) || [];
    
    if (fcmTokens.length === 0) {
      return NextResponse.json(
        { error: 'No FCM tokens found in environment variables' },
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
            title: title || 'Notification',
            body: body || 'You have a new notification',
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
      title: title || 'Notification',
      body: body || 'You have a new notification',
      data: data || {},
      sentBy: user.userId,
      sentByUsername: user.username,
      fcmTokens: fcmTokens,
      results: results,
      successCount,
      failureCount,
      createdAt: new Date(),
      status: 'sent'
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