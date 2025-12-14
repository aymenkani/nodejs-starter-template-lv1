const API_BASE = '/api/v1';

// --- Utils ---
const log = (msg, type = 'info') => {
    const logs = document.getElementById('logs');
    if (!logs) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logs.appendChild(entry);
    logs.scrollTop = logs.scrollHeight;
};

const getToken = () => document.getElementById('token').value.trim();

// --- File Upload Logic ---
document.getElementById('uploadBtn').addEventListener('click', async () => {
    const token = getToken();
    const fileInput = document.getElementById('file');
    const file = fileInput.files[0];
    const btn = document.getElementById('uploadBtn');

    if (!token) return log('Error: Access Token is required.', 'error');
    if (!file) return log('Error: Please select a file.', 'error');

    btn.disabled = true;

    try {
        // 1. Generate Signed URL
        log('1. Fetching Signed URL...', 'info');
        const signRes = await fetch(`${API_BASE}/upload/generate-signed-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                fileSize: file.size,
                isPublic: document.getElementById('isPublic').checked
            })
        });

        if (!signRes.ok) throw new Error((await signRes.json()).message || 'Failed to get URL');
        const { signedUrl, fileId } = await signRes.json();
        
        // 2. Upload to S3
        log('2. Uploading to S3...', 'info');
        const uploadRes = await fetch(signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: file
        });
        if (!uploadRes.ok) throw new Error('S3 upload failed');

        // 3. Confirm
        log('3. Confirming upload...', 'info');
        const confirmRes = await fetch(`${API_BASE}/upload/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ fileId })
        });
        if (!confirmRes.ok) throw new Error((await confirmRes.json()).message);

        log('Success! File uploaded and processing.', 'success');
        fileInput.value = ''; // Reset
        fetchFiles(); // Refresh list
    } catch (err) {
        log(err.message, 'error');
        console.error(err);
    } finally {
        btn.disabled = false;
    }
});

// --- File List Logic ---
const fetchFiles = async () => {
    const token = getToken();
    const listContainer = document.getElementById('fileList');
    if (!token) return;

    try {
        const filter = document.querySelector('input[name="filter"]:checked').value;
        const res = await fetch(`${API_BASE}/files?filter=${filter}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch files');
        const files = await res.json();
        
        if (files.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center;color:#718096">No files found.</p>';
            return;
        }

        listContainer.innerHTML = files.map(file => `
            <div class="file-item">
                <div class="file-info">
                    <strong>${file.originalName}</strong>
                    <span>${new Date(file.createdAt).toLocaleString()} • ${file.user.email}</span>
                </div>
                <div style="text-align:right">
                    <span class="badge ${file.isPublic ? 'badge-public' : 'badge-private'}">
                        ${file.isPublic ? 'Public' : 'Private'}
                    </span>
                    <br>
                    <span style="font-size:0.75rem; color:${getStatusColor(file.status)}">${file.status}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        listContainer.innerHTML = `<p style="color:red">Error loading files: ${err.message}</p>`;
    }
};

const getStatusColor = (status) => {
    if (status === 'COMPLETED') return 'green';
    if (status === 'FAILED') return 'red';
    if (status === 'PROCESSING') return 'orange';
    return 'gray';
};

document.getElementById('refreshFilesBtn').addEventListener('click', fetchFiles);
document.querySelectorAll('input[name="filter"]').forEach(el => el.addEventListener('change', fetchFiles));

// --- Chat Logic ---
// We hold user Messages state to maintain history if needed, 
// but the backend agent controller expects { messages: [...] }
let chatHistory = []; 

document.getElementById('sendChatBtn').addEventListener('click', async () => {
    const token = getToken();
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg || !token) return;

    // Append User Message
    appendMessage(msg, 'user');
    chatHistory.push({ role: 'user', content: msg });
    input.value = '';

    // Create AI Message Placeholder
    const aiMsgParams = appendMessage('Typing...', 'ai');
    
    try {
        const response = await fetch(`${API_BASE}/agent/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ messages: chatHistory })
        });

        if (!response.ok) throw new Error('Chat failed');

        // Reading Stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiText = '';
        aiMsgParams.div.textContent = ''; // Clear "Typing..."

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            aiText += chunk;
            // Simple render (could use a markdown library here)
            aiMsgParams.div.innerHTML = marked.parse(aiText);
            // Scroll to bottom
            const chatBox = document.getElementById('chatBox');
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        chatHistory.push({ role: 'assistant', content: aiText });

    } catch (err) {
        aiMsgParams.div.textContent = 'Error: ' + err.message;
        aiMsgParams.div.style.color = 'red';
    }
});

const appendMessage = (text, role) => {
    const chatBox = document.getElementById('chatBox');
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return { div };
};

// Auto-load files on token paste (convenience)
document.getElementById('token').addEventListener('blur', fetchFiles);