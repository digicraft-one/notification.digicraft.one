'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchNotifications(token, 1);
  }, [router]);

  const fetchNotifications = async (token, page = 1) => {
    try {
      const response = await fetch(`/api/notifications?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-secret-key': process.env.NEXT_PUBLIC_NOTIFICATION_SECRET || 'your-secret-key'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        setTotalPages(data.pagination.pages);
        setCurrentPage(data.pagination.page);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    setSending(true);
    setResult(null);

    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-secret-key': process.env.NEXT_PUBLIC_NOTIFICATION_SECRET || 'your-secret-key'
        },
        body: JSON.stringify({
          title,
          body,
          data: {
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setTitle('');
        setBody('');
        // Refresh notifications
        fetchNotifications(token, currentPage);
      }
    } catch (error) {
      setResult({
        error: 'Failed to send notification',
        details: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Dashboard</h1>
              <p className="text-gray-600">Welcome, {user?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Send Notification Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Send Notification</h2>
            <form onSubmit={sendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notification title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notification message"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Notification'}
              </button>
            </form>

            {result && (
              <div className={`mt-4 p-3 rounded-md ${
                result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
              }`}>
                <div className={`text-sm ${result.error ? 'text-red-800' : 'text-green-800'}`}>
                  {result.error ? result.error : result.message}
                </div>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Recent Notifications</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification._id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 mt-1">{notification.body}</p>
                        <div className="mt-2 text-sm text-gray-500">
                          <span>Sent by: {notification.sentByUsername}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(notification.createdAt)}</span>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-green-600">
                            Success: {notification.successCount}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="text-red-600">
                            Failed: {notification.failureCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => fetchNotifications(localStorage.getItem('authToken'), currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => fetchNotifications(localStorage.getItem('authToken'), currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 