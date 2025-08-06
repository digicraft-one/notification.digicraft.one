require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notification-system';

async function setupUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('notification-system');
    const usersCollection = db.collection('users');
    
    // Check if admin user already exists
    const existingUser = await usersCollection.findOne({ username: 'admin' });
    
    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    const adminUser = {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date()
    };
    
    await usersCollection.insertOne(adminUser);
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error setting up user:', error);
  } finally {
    await client.close();
  }
}

setupUser(); 