import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
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

    const client = await clientPromise;
    const db = client.db('notification-system');
    const usersCollection = db.collection('users');

    // Find user by username
    const user = await usersCollection.findOne({ username });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.username);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
} 