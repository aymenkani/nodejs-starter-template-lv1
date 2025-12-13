const API_BASE = '/api/v1';

const app = {
    state: {
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user')) || null,
        currentView: 'chat',
        socket: null,
        chatHistory: [], // New state for history
        secretClickCount: 0 // Counter for secret login form
    },

    init: async () => {
        app.updateAuthUI();
        app.setupListeners();
        
        if (app.state.token) {
            await app.connectSocket();
            app.loadNotifications();
            app.switchView('chat');
        } else {
            app.logToTerminal('System', 'Waiting for user authentication...', 'info');
        }
    },

    // --- Auth Logic ---
    
    loginAsAdmin: async () => {
        // Hardcoded demo admin creds (as per user instructions/env)
        // Note: In real app, never hardcode. For demo purposes only.
        const email = 'admin@example.com'; 
        const password = 'veRy1stronG2paSsWord3'; 

        app.logToTerminal('Auth', `Attempting Admin Login (${email})...`, 'info');
        await app.performLogin(email, password);
    },

    loginAsUser: async () => {
        // 1. Check for cached credentials
        const cached = localStorage.getItem('demoCreds');
        if (cached) {
            const { email, password } = JSON.parse(cached);
            app.logToTerminal('Auth', `Found cached demo user (${email}). Logging in...`, 'info');
            await app.performLogin(email, password);
            return;
        }

        // 2. Register New if no cache
        const timestamp = Date.now();
        const email = `demo_${timestamp}@test.com`;
        const password = 'password123';
        
        app.logToTerminal('Auth', `Registering new Demo User (${email})...`, 'info');
        try {
            // Register
            const regRes = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username: `User_${timestamp}` })
            });
            
            if (!regRes.ok) throw new Error('Registration failed');
            
            // Save Credentials for future logins (even after logout)
            localStorage.setItem('demoCreds', JSON.stringify({ email, password }));
            
            app.logToTerminal('Auth', 'Registration successful. Logging in...', 'success');
            
            // Login
            await app.performLogin(email, password);
        } catch (err) {
            app.logToTerminal('Auth', err.message, 'error');
        }
    },

    loginWithCustomCredentials: async () => {
        const email = document.getElementById('secretEmail').value.trim();
        const password = document.getElementById('secretPassword').value.trim();
        
        if (!email || !password) {
            alert('Email and password are required');
            return;
        }
        
        app.logToTerminal('Auth', `Attempting Secret Login (${email})...`, 'info');
        await app.performLogin(email, password);
    },

    performLogin: async (email, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) throw new Error('Login failed');
            const data = await res.json();
            
            // Save State
            app.state.token = data.access.token;
            app.state.user = data.user;
            localStorage.setItem('token', app.state.token);
            localStorage.setItem('user', JSON.stringify(app.state.user));
            
            app.logToTerminal('Auth', `Welcome back, ${data.user.username} [${data.user.role}]`, 'success');
            app.updateAuthUI();
            app.connectSocket();
            app.loadNotifications();
            app.switchView('chat');
        } catch (err) {
            app.logToTerminal('Auth', err.message, 'error');
            alert('Login Failed: ' + err.message);
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        app.state.token = null;
        app.state.user = null;
        app.state.chatHistory = []; // Clear History
        
        // Reset Chat UI
        const chatBox = document.getElementById('chatBox');
        chatBox.innerHTML = `
            <div class="flex gap-3">
                <div class="w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
                <div class="bg-dark-800 p-4 rounded-2xl rounded-tl-none border border-dark-700 text-sm leading-relaxed max-w-[85%]">
                    Hello! I'm your RAG assistant. Upload documents to the Knowledge Base to give me context, then ask away!
                </div>
            </div>`;
        
        if (app.state.socket) app.state.socket.disconnect();
        
        app.updateAuthUI();
        app.logToTerminal('Auth', 'User logged out.', 'info');
    },

    updateAuthUI: () => {
        const overlay = document.getElementById('authOverlay');
        const userProfile = document.getElementById('userProfile');
        
        // Reset secret form state when overlay visibility changes
        app.state.secretClickCount = 0;
        document.getElementById('secretAuthForm').classList.add('hidden');
        document.getElementById('normalAuthForm').classList.remove('hidden');
        
        if (app.state.token) {
            overlay.classList.add('hidden');
            
            // Update Sidebar Profile
            document.getElementById('userName').textContent = app.state.user.username;
            document.getElementById('userRole').textContent = app.state.user.role;
            document.getElementById('userAvatar').textContent = app.state.user.username[0].toUpperCase();
            
            // Public Checkbox Logic & Admin Features
            const isCheckWrapper = document.getElementById('publicCheckWrapper');
            const isCheck = document.getElementById('uploadIsPublic');
            const adminPanel = document.getElementById('adminNotificationPanel');

            if (app.state.user.role === 'ADMIN') {
                // Public Uploads
                isCheck.disabled = false;
                isCheckWrapper.classList.remove('opacity-50');
                // Admin Notifications
                adminPanel.classList.remove('hidden');
            } else {
                // Public Uploads
                isCheck.disabled = true;
                isCheck.checked = false;
                isCheckWrapper.classList.add('opacity-50');
                // Admin Notifications
                adminPanel.classList.add('hidden');
            }
        } else {
            overlay.classList.remove('hidden');
        }
    },

    // --- Admin Features ---
    sendAdminNotification: async () => {
        const msgInput = document.getElementById('adminNotifMessage');
        const message = msgInput.value.trim();
        if (!message) return alert('Message is required');

        app.logToTerminal('Admin', 'Sending broadcast notification...', 'info');
        
        try {
            const res = await app.request(`${API_BASE}/admin/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (!res.ok) throw new Error('Failed to send notification');
            
            app.logToTerminal('Success', 'Notification broadcasted to all users.', 'success');
            msgInput.value = ''; // Clear input

        } catch (err) {
            app.logToTerminal('Error', err.message, 'error');
        }
    },

    // --- Fetch Wrapper / Interceptor (401 Handling) ---
    request: async (url, options = {}) => {
        if (!options.headers) options.headers = {};
        if (app.state.token) options.headers['Authorization'] = `Bearer ${app.state.token}`;
        
        let response = await fetch(url, options);
        
        if (response.status === 401) {
            app.logToTerminal('Auth', 'Token expired. Refreshing...', 'warning');
            // Try Refresh (Not implemented in demo scope fully, but simulating retry or log out)
            // For this demo, we'll force logout to keep it simple unless /refresh is fully standard
            app.logout(); 
            throw new Error('Session expired. Please login again.');
        }
        
        return response;
    },

    // --- Terminal Logic ---
    logToTerminal: (source, message, type = 'info') => {
        const term = document.getElementById('terminalOutput');
        const entry = document.createElement('div');
        entry.className = 'font-mono text-xs mb-1 break-words';
        
        const timestamp = new Date().toLocaleTimeString().split(' ')[0];
        const color = type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : type === 'warning' ? 'text-yellow-400' : type === 'backend' ? 'text-green-600' : 'text-blue-400';
        
        entry.innerHTML = `<span class="opacity-50">[${timestamp}]</span> <strong class="${color}">${source}:</strong> <span class="text-slate-300">${message}</span>`;
        
        term.appendChild(entry);
        term.scrollTop = term.scrollHeight;
    },

    // --- View Switching ---
    switchView: (viewName) => {
        // Hide all views
        ['chat', 'files', 'notifications'].forEach(v => {
            document.getElementById(`view-${v}`).classList.add('hidden');
            document.getElementById(`nav${v.charAt(0).toUpperCase() + v.slice(1)}`).classList.remove('bg-blue-600/10', 'text-blue-400');
        });
        
        // Show selected
        document.getElementById(`view-${viewName}`).classList.remove('hidden');
        document.getElementById(`nav${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`).classList.add('bg-blue-600/10', 'text-blue-400');
        
        app.state.currentView = viewName;
        
        if (viewName === 'files') app.fetchFiles();
    },

    // --- Chat Features ---
    sendChat: async () => {
        const input = document.getElementById('chatInput');
        const msg = input.value.trim();
        if (!msg) return;
        
        // UI Update
        app.appendChatMessage(msg, 'user');
        input.value = '';
        
        // Add to history
        app.state.chatHistory.push({ role: 'user', content: msg });
        
        const aiMsgDiv = app.appendChatMessage('...', 'ai');
        
        try {
            app.logToTerminal('Chat', `Sending message: "${msg.substring(0, 20)}..."`, 'info');
            
            const response = await app.request(`${API_BASE}/agent/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: app.state.chatHistory }) // Send full history
            });

            if (!response.ok) throw new Error(`${(await response.text())}`);

            // Stream Handling
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiText = '';
            aiMsgDiv.innerHTML = ''; // Clear loader

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                aiText += chunk;
                aiMsgDiv.innerHTML = marked.parse(aiText);
                document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
            }
            
            // Add AI response to history
            app.state.chatHistory.push({ role: 'assistant', content: aiText });
            
            app.logToTerminal('Backend', 'AI Response Stream Completed', 'backend');

        } catch (err) {
            aiMsgDiv.textContent = 'Error: ' + err.message;
            aiMsgDiv.classList.add('text-red-400');
        }
    },

    appendChatMessage: (text, role) => {
        const box = document.getElementById('chatBox');
        const wrapper = document.createElement('div');
        wrapper.className = 'flex gap-3 fade-in';
        
        if (role === 'user') {
            wrapper.classList.add('flex-row-reverse');
            wrapper.innerHTML = `
                <div class="w-8 h-8 rounded-lg bg-dark-700 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">U</div>
                <div class="bg-blue-600 p-4 rounded-2xl rounded-tr-none text-white text-sm leading-relaxed max-w-[85%]">
                    ${text}
                </div>
            `;
        } else {
            wrapper.innerHTML = `
                <div class="w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
                <div class="bg-dark-800 p-4 rounded-2xl rounded-tl-none border border-dark-700 text-sm leading-relaxed max-w-[85%]">
                    ${text}
                </div>
            `;
        }
        box.appendChild(wrapper);
        box.scrollTop = box.scrollHeight;
        return role === 'ai' ? wrapper.querySelector('.bg-dark-800') : null;
    },

    // --- File Features ---
    uploadFile: async () => {
        const fileInput = document.getElementById('uploadFile');
        const isPublic = document.getElementById('uploadIsPublic').checked;
        const file = fileInput.files[0];
        const btn = document.getElementById('confirmUploadBtn');
        
        if (!file) return alert('Select a file');
        
        btn.disabled = true;
        btn.textContent = 'Processing...';
        document.getElementById('uploadModal').classList.add('hidden'); // Hide immediately to focus on terminal

        try {
            // 1. Get Signed URL
            app.logToTerminal('Upload', 'Requesting Signed URL...', 'info');
            const signRes = await app.request(`${API_BASE}/upload/generate-signed-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type || 'application/octet-stream',
                    fileSize: file.size,
                    isPublic
                })
            });

            if (!signRes.ok) throw new Error('Signed URL failed');
            const { signedUrl, fileId } = await signRes.json();
            
            // 2. Upload S3
            app.logToTerminal('Upload', `Uploading to S3 (ID: ${fileId})...`, 'info');
            const uploadRes = await fetch(signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file
            });
            if (!uploadRes.ok) throw new Error('S3 Upload failed');
            
            // 3. Confirm
            app.logToTerminal('Upload', 'Confirming upload with backend...', 'info');
            await app.request(`${API_BASE}/upload/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId })
            });

            app.logToTerminal('Success', 'File uploaded! Ingestion queued.', 'success');
            
            // Cleanup
            fileInput.value = '';
            app.fetchFiles();

        } catch (err) {
            app.logToTerminal('Error', err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Upload';
        }
    },

    fetchFiles: async () => {
        const list = document.getElementById('fileList');
        const filter = document.querySelector('input[name="fileFilter"]:checked').value;
        
        list.innerHTML = '<div class="text-center p-4"><div class="loader mx-auto"></div></div>';
        
        try {
            const res = await app.request(`${API_BASE}/files?filter=${filter}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const files = await res.json();
            
            if (files.length === 0) {
                list.innerHTML = '<div class="text-slate-500 text-center p-4">No files found.</div>';
                return;
            }

            list.innerHTML = files.map(f => `
                <div class="flex items-center justify-between p-3 bg-dark-900 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <div class="bg-dark-800 p-2 rounded text-blue-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div class="overflow-hidden">
                            <div class="text-white text-sm font-medium truncate">${f.originalName}</div>
                            <div class="text-xs text-slate-500">${new Date(f.createdAt).toLocaleDateString()} • ${f.user.email}</div>
                        </div>
                    </div>
                    <div class="text-right flex flex-col items-end gap-1">
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${f.isPublic ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'} border border-white/5">
                            ${f.isPublic ? 'Public' : 'Private'}
                        </span>
                        <span class="text-[10px] text-slate-400 capitalize">${f.status.toLowerCase()}</span>
                    </div>
                </div>
            `).join('');
            
        } catch (err) {
            list.innerHTML = `<div class="text-red-400 text-center p-4">${err.message}</div>`;
        }
    },

    // --- Socket.IO ---
    connectSocket: async () => {
        if (app.state.socket && app.state.socket.connected) return;

        const token = app.state.token;
        if (!token) return;

        app.logToTerminal('Socket', 'Connecting to backend...', 'info');

        // Socket Client
        const socket = io('/', {
            extraHeaders: {
                Authorization: `Bearer ${token}`
            },
            //transports: ['websocket']
        });

        socket.on('connect', () => {
            app.logToTerminal('Socket', `Connected (ID: ${socket.id})`, 'backend');
        });

        socket.on('disconnect', () => {
            app.logToTerminal('Socket', 'Disconnected', 'warning');
        });

        socket.on('connect_error', (err) => {
            app.logToTerminal('Socket Error', err.message, 'error');
        });

        // Backend Events
        socket.on('pending_notifications', (notifications) => {
            app.logToTerminal('Backend', `Received ${notifications.length} pending notifications`, 'backend');
            app.loadNotifications();
        });
        
        socket.on('new_notification', (data) => {
            app.logToTerminal('Backend', `Received new notification: ${data.message}`, 'backend');
            // Refetch to get the proper DB entry with ID and Timestamp
            app.loadNotifications();
        });
        
        socket.on('user_updated', (data) => {
             app.logToTerminal('Backend', `Event: user_updated`, 'backend');
        });

        app.state.socket = socket;
    },

    // --- Notification Features ---
    loadNotifications: async () => {
        const list = document.getElementById('notifList');
        if (!list) return;
        
        try {
            const res = await app.request(`${API_BASE}/notifications`);
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const result = await res.json();
            const notifications = result.data; // Ordered by createdAt desc

            list.innerHTML = ''; // Clear
            
            if (notifications.length === 0) {
                list.innerHTML = '<div class="text-center text-slate-500 py-10">No notifications</div>';
            } else {
                notifications.forEach(n => app.renderNotification(n)); 
            }
            app.updateNotificationBadge();

        } catch (err) {
            app.logToTerminal('Error', `Failed to load notifications: ${err.message}`, 'error');
        }
    },

    updateNotificationBadge: () => {
        const list = document.getElementById('notifList');
        if (!list) return;
        const unreadCount = list.querySelectorAll('.notif-unread').length;
        const badge = document.getElementById('navNotifBadge');
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    },

    markAsRead: async (id, element) => {
        try {
            // Optimistic Update
            element.classList.remove('notif-unread', 'border-blue-500/30', 'bg-dark-800');
            element.classList.add('opacity-60', 'bg-dark-900', 'border-dark-700');
            
            const tag = element.querySelector('.status-tag');
            if (tag) {
                tag.className = 'status-tag text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-dark-700 text-slate-500 border-dark-600';
                tag.textContent = 'READ';
            }
            app.updateNotificationBadge();

            await app.request(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
        } catch (err) {
            app.logToTerminal('Error', `Failed to mark read: ${err.message}`, 'error');
        }
    },

    deleteNotification: async (id, element) => {
        if (!confirm('Delete this notification?')) return;
        try {
            element.remove();
            app.updateNotificationBadge();
            await app.request(`${API_BASE}/notifications/${id}`, { method: 'DELETE' });
            app.logToTerminal('Info', 'Notification deleted', 'info');
        } catch (err) {
            app.logToTerminal('Error', `Failed to delete: ${err.message}`, 'error');
        }
    },

    renderNotification: (data) => {
        const list = document.getElementById('notifList');
        
        const isRead = data.status === 'READ';
        const typeColor = !isRead 
            ? 'bg-blue-900/30 text-blue-400 border-blue-500/20' 
            : 'bg-dark-700 text-slate-500 border-dark-600';
        
        const containerClass = !isRead
            ? 'notif-unread relative p-4 bg-dark-800 rounded-lg border border-blue-500/30 flex gap-4 transition-all hover:bg-dark-750 cursor-pointer'
            : 'relative p-4 bg-dark-900 rounded-lg border border-dark-700 flex gap-4 transition-all opacity-60 hover:opacity-100 cursor-pointer';

        const item = document.createElement('div');
        item.className = containerClass;
        
        item.onclick = (e) => {
            if (e.target.closest('.delete-btn')) return;
            if (data.status !== 'READ') app.markAsRead(data.id, item);
        };

        item.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="status-tag text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${typeColor}">
                        ${data.status}
                    </span>
                    <span class="text-xs text-slate-500">${new Date(data.createdAt).toLocaleTimeString()}</span>
                </div>
                <p class="text-sm text-slate-300 font-medium">${data.message}</p>
            </div>
            <button onclick="app.deleteNotification('${data.id}', this.parentElement)" class="delete-btn text-slate-500 hover:text-red-400 transition-colors p-1" title="Delete">
                 <svg class="w-4 h-4 cursor-not-allowed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        `;
        
        list.appendChild(item); // We append because API returns sorted desc (newest first)
    },

    setupListeners: () => {
        // Auth
        document.getElementById('authAdminBtn').addEventListener('click', app.loginAsAdmin);
        document.getElementById('authUserBtn').addEventListener('click', app.loginAsUser);
        document.getElementById('logoutBtn').addEventListener('click', app.logout);
        
        // Secret Login Form - Click Counter
        const authOverlay = document.getElementById('authOverlay');
        authOverlay.addEventListener('click', (e) => {
            // Only count clicks on the overlay itself, not on buttons or inputs
            if (e.target === authOverlay || e.target.classList.contains('bg-dark-800')) {
                app.state.secretClickCount++;
                
                if (app.state.secretClickCount >= 10) {
                    // Show secret form
                    document.getElementById('normalAuthForm').classList.add('hidden');
                    document.getElementById('secretAuthForm').classList.remove('hidden');
                    app.state.secretClickCount = 0; // Reset counter
                    app.logToTerminal('System', 'Secret login form activated', 'info');
                }
            }
        });
        
        // Secret Login Form - Buttons
        document.getElementById('secretBackBtn').addEventListener('click', () => {
            document.getElementById('secretAuthForm').classList.add('hidden');
            document.getElementById('normalAuthForm').classList.remove('hidden');
            app.state.secretClickCount = 0;
        });
        
        document.getElementById('secretLoginBtn').addEventListener('click', app.loginWithCustomCredentials);
        
        // Secret Login Form - Enter key support
        document.getElementById('secretEmail').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('secretPassword').focus();
        });
        document.getElementById('secretPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') app.loginWithCustomCredentials();
        });
        
        // Navigation
        document.getElementById('navChat').addEventListener('click', () => app.switchView('chat'));
        document.getElementById('navFiles').addEventListener('click', () => app.switchView('files'));
        document.getElementById('navNotifications').addEventListener('click', () => app.switchView('notifications'));

        // Chat
        document.getElementById('openUploadModalBtn').addEventListener('click', () => {
            document.getElementById('uploadModal').classList.remove('hidden');
        });
        document.getElementById('sendChatActionBtn').addEventListener('click', app.sendChat);
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') app.sendChat();
        });

        // Files
        document.querySelectorAll('input[name="fileFilter"]').forEach(el => {
            el.addEventListener('change', app.fetchFiles);
        });
        document.getElementById('refreshFilesBtn').addEventListener('click', app.fetchFiles);

        // Terminal
        document.getElementById('toggleTerminalBtn').addEventListener('click', () => {
            document.getElementById('terminal').classList.toggle('h-10');
        });
        
        // Admin Notification
        document.getElementById('sendAdminNotifBtn').addEventListener('click', app.sendAdminNotification);

        // Upload
        document.getElementById('cancelUploadBtn').addEventListener('click', () => {
            document.getElementById('uploadModal').classList.add('hidden');
        });
        document.getElementById('confirmUploadBtn').addEventListener('click', app.uploadFile);
    }
};

// Start
document.addEventListener('DOMContentLoaded', app.init);
