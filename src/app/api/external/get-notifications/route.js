import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.NEXT_PUBLIC_NOTIFICATION_SECRET) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('notification-system');
    const notificationsCollection = db.collection('notifications');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // Optional filters
    const source = searchParams.get('source'); // 'external-api', 'dashboard', etc.
    const sender = searchParams.get('sender'); // specific sender/app
    const status = searchParams.get('status'); // 'sent', 'failed', etc.

    // Build filter object
    const filter = {};
    if (source) filter.source = source;
    if (sender) filter.sender = sender;
    if (status) filter.status = status;

    // Get total count with filters
    const totalCount = await notificationsCollection.countDocuments(filter);

    // Get notifications with pagination and filters
    const notifications = await notificationsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Format notifications for external API (remove sensitive data)
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sender: notification.sender || notification.sentByUsername,
      source: notification.source,
      successCount: notification.successCount,
      failureCount: notification.failureCount,
      status: notification.status,
      createdAt: notification.createdAt,
      // Don't include FCM tokens or detailed results for security
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      filters: {
        source,
        sender,
        status
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
} 