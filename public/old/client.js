document.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('token');
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const statusEl = document.getElementById('status');
    const notificationsList = document.getElementById('notifications');

    let socket;

    function addNotification(message) {
        const item = document.createElement('li');
        item.textContent = typeof message === 'object' ? JSON.stringify(message) : message;
        notificationsList.prepend(item);
    }

    function setStatus(isConnected) {
        if (isConnected) {
            statusEl.textContent = 'Connected';
            statusEl.classList.remove('disconnected');
            statusEl.classList.add('connected');
            connectBtn.disabled = true;
            disconnectBtn.disabled = false;
            tokenInput.disabled = true;
        } else {
            statusEl.textContent = 'Disconnected';
            statusEl.classList.remove('connected');
            statusEl.classList.add('disconnected');
            connectBtn.disabled = false;
            disconnectBtn.disabled = true;
            tokenInput.disabled = false;
        }
    }

    connectBtn.addEventListener('click', () => {
        const token = tokenInput.value.trim();
        if (!token) {
            alert('Please provide a JWT access token.');
            return;
        }

        // The 'extraHeaders' option sends the token in the Authorization header
        // of the initial HTTP request, which is what our server-side passport-jwt strategy expects.
        socket = io({
            extraHeaders: {
                Authorization: `Bearer ${token}`
            }
            // This is important if your client and server are on different origins during development
            // but since we are serving from the same app, it's not strictly necessary.
            // transports: ['websocket'] 
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setStatus(true);
            addNotification(`Connected to server with socket ID: ${socket.id}`);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setStatus(false);
            addNotification('Disconnected from server.');
        });

        socket.on('connect_error', (err) => {
            console.error('Connection Error:', err.message);
            addNotification(`Connection Error: ${err.message}`);
            setStatus(false);
        });

        // Listen for real-time notifications from the admin
        socket.on('new_notification', (data) => {
            console.log('Received new notification:', data);
            addNotification(`New Notification: ${data.message}`);
        });

        // Listen for pending notifications that were stored while offline
        socket.on('pending_notifications', (notifications) => {
            console.log('Received pending notifications:', notifications);
            notifications.forEach(notification => {
                addNotification(`Pending Notification: ${notification.message}`);
            });
        });
    });

    disconnectBtn.addEventListener('click', () => {
        if (socket) {
            socket.disconnect();
        }
    });

    setStatus(false);
});
