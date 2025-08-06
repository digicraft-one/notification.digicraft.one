# External Notification API Documentation

This document describes how to use the external API endpoint to send notifications from your applications.

## 🔗 **External API Endpoints**

### **Send Notification**
```
POST /api/external/send-notification
```

**URL:** `http://your-domain.com/api/external/send-notification`

### **Get Notifications**
```
GET /api/external/get-notifications
```

**URL:** `http://your-domain.com/api/external/get-notifications`

## 🔐 **Authentication**

The external API uses a simple API key authentication method:

**Header Required:**
```
x-api-key: your-notification-secret
```

The API key should match your `NEXT_PUBLIC_NOTIFICATION_SECRET` environment variable.

## 📝 **Request Format**

### **Send Notification**

#### **Headers:**
```
Content-Type: application/json
x-api-key: your-notification-secret
```

#### **Request Body:**
```json
{
  "title": "Notification Title",
  "body": "Notification message",
  "data": {
    "customKey": "customValue",
    "action": "open_app",
    "screen": "home"
  },
  "sender": "Your App Name"
  // "tokens": ["fcm_token_1", "fcm_token_2"] // Optional - overrides environment tokens
}
```

#### **Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | ✅ | Notification title |
| `body` | string | ✅ | Notification message |
| `data` | object | ❌ | Custom data to send with notification |
| `sender` | string | ❌ | Name of the application sending the notification |
| `tokens` | array | ❌ | **Optional override** - specific FCM tokens to send to (if not provided, uses `FCM_TOKEN` from environment) |

### **Get Notifications**

#### **Headers:**
```
x-api-key: your-notification-secret
```

#### **Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | ❌ | Page number (default: 1) |
| `limit` | number | ❌ | Number of notifications per page (default: 10) |
| `source` | string | ❌ | Filter by source ('external-api', 'dashboard') |
| `sender` | string | ❌ | Filter by sender/app name |
| `status` | string | ❌ | Filter by status ('sent', 'failed') |

## 📤 **Response Format**

### **Send Notification - Success Response:**
```json
{
  "success": true,
  "successCount": 2,
  "failureCount": 0,
  "results": [
    {
      "token": "fcm_token_1",
      "success": true,
      "messageId": "message_id_1"
    },
    {
      "token": "fcm_token_2",
      "success": true,
      "messageId": "message_id_2"
    }
  ],
  "notificationId": "mongodb_object_id",
  "message": "Successfully sent 2 notifications, 0 failed"
}
```

### **Get Notifications - Success Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "mongodb_object_id",
      "title": "Notification Title",
      "body": "Notification message",
      "data": {
        "customKey": "customValue",
        "action": "open_app"
      },
      "sender": "Your App Name",
      "source": "external-api",
      "successCount": 2,
      "failureCount": 0,
      "status": "sent",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "filters": {
    "source": "external-api",
    "sender": null,
    "status": null
  }
}
```

### **Error Response:**
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## 💻 **Code Examples**

### **JavaScript/Node.js:**

#### **Send Notification:**
```javascript
const sendNotification = async (title, body, data = {}, sender = null, tokens = null) => {
  const API_KEY = 'your-notification-secret';
  const API_URL = 'http://your-domain.com/api/external/send-notification';
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        title,
        body,
        data,
        ...(sender && { sender }),
        ...(tokens && { tokens })
      })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Usage examples
// Send to environment tokens (default behavior)
sendNotification('Hello!', 'This is a test notification', {
  action: 'open_app',
  screen: 'home'
}, 'My App');

// Send to specific tokens (overrides environment tokens)
sendNotification('Hello!', 'This is a test notification', {
  action: 'open_app'
}, 'My App', ['fcm_token_1', 'fcm_token_2']);
```

#### **Get Notifications:**
```javascript
const getNotifications = async (params = {}) => {
  const API_KEY = 'your-notification-secret';
  const API_URL = 'http://your-domain.com/api/external/get-notifications';
  
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `${API_URL}?${queryParams}` : API_URL;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Usage examples
// Get all notifications
const allNotifications = await getNotifications();

// Get first page with 5 notifications
const firstPage = await getNotifications({ page: 1, limit: 5 });

// Get external API notifications only
const externalNotifications = await getNotifications({ source: 'external-api' });

// Get notifications from specific sender
const senderNotifications = await getNotifications({ sender: 'My App' });

// Get notifications with multiple filters
const filteredNotifications = await getNotifications({ 
  source: 'external-api', 
  limit: 3,
  page: 1
});
```

### **Python:**
```python
import requests
import json

def send_notification(title, body, data=None, sender=None, tokens=None):
    api_key = 'your-notification-secret'
    api_url = 'http://your-domain.com/api/external/send-notification'
    
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': api_key
    }
    
    payload = {
        'title': title,
        'body': body,
        'data': data or {}
    }
    
    if sender:
        payload['sender'] = sender
    
    if tokens:
        payload['tokens'] = tokens
    
    response = requests.post(api_url, headers=headers, json=payload)
    return response.json()

# Usage
result = send_notification('Hello!', 'This is a test notification', {
    'action': 'open_app',
    'screen': 'home'
}, 'My App')
print(result)
```

### **cURL:**

#### **Send Notification:**
```bash
# Send to environment tokens (default)
curl -X POST http://your-domain.com/api/external/send-notification \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-notification-secret" \
  -d '{
    "title": "Hello!",
    "body": "This is a test notification",
    "data": {
      "action": "open_app",
      "screen": "home"
    },
    "sender": "My App"
  }'

# Send to specific tokens (overrides environment)
curl -X POST http://your-domain.com/api/external/send-notification \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-notification-secret" \
  -d '{
    "title": "Hello!",
    "body": "This is a test notification",
    "data": {
      "action": "open_app"
    },
    "sender": "My App",
    "tokens": ["fcm_token_1", "fcm_token_2"]
  }'
```

#### **Get Notifications:**
```bash
# Get all notifications
curl -X GET "http://your-domain.com/api/external/get-notifications" \
  -H "x-api-key: your-notification-secret"

# Get first page with 5 notifications
curl -X GET "http://your-domain.com/api/external/get-notifications?page=1&limit=5" \
  -H "x-api-key: your-notification-secret"

# Get external API notifications only
curl -X GET "http://your-domain.com/api/external/get-notifications?source=external-api" \
  -H "x-api-key: your-notification-secret"

# Get notifications from specific sender
curl -X GET "http://your-domain.com/api/external/get-notifications?sender=My%20App" \
  -H "x-api-key: your-notification-secret"

# Get notifications with multiple filters
curl -X GET "http://your-domain.com/api/external/get-notifications?source=external-api&limit=3&page=1" \
  -H "x-api-key: your-notification-secret"
```

### **PHP:**
```php
<?php
function sendNotification($title, $body, $data = [], $sender = null, $tokens = null) {
    $apiKey = 'your-notification-secret';
    $apiUrl = 'http://your-domain.com/api/external/send-notification';
    
    $payload = [
        'title' => $title,
        'body' => $body,
        'data' => $data
    ];
    
    if ($sender) {
        $payload['sender'] = $sender;
    }
    
    if ($tokens) {
        $payload['tokens'] = $tokens;
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Usage
$result = sendNotification('Hello!', 'This is a test notification', [
    'action' => 'open_app',
    'screen' => 'home'
], 'My App');
print_r($result);
?>
```

## 🧪 **Testing**

### **Test the APIs:**
```bash
# Test send notification API
node scripts/test-external-api.js

# Test get notifications API
node scripts/test-external-get-notifications.js
```

### **Manual Testing:**
1. Start your Next.js server: `npm run dev`
2. Use any of the code examples above
3. Check the dashboard to see the sent notifications

## ⚙️ **Configuration**

### **Environment Variables:**
Make sure these are set in your `.env.local`:
```env
NEXT_PUBLIC_NOTIFICATION_SECRET=your-notification-secret
FCM_TOKEN=token1,token2,token3
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
MONGODB_URI=your-mongodb-connection-string
```

## 🔒 **Security Notes**

- Keep your API key secure
- Use HTTPS in production
- Rotate your API key regularly
- The API key should be the same as your `NEXT_PUBLIC_NOTIFICATION_SECRET`

## 📊 **Features**

- ✅ Simple API key authentication
- ✅ **Uses FCM tokens from environment by default**
- ✅ Optional token override for specific notifications
- ✅ Custom data support
- ✅ Detailed success/failure reporting
- ✅ MongoDB storage for notification history
- ✅ Firebase Cloud Messaging integration
- ✅ Error handling and validation

## 🚨 **Error Codes**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Missing required fields | Title and body are required |
| 400 | No FCM tokens found | No tokens provided or configured |
| 401 | Invalid API key | API key doesn't match |
| 500 | Internal server error | Server error, check logs |

This external API provides a simple and secure way to send notifications from any application! 