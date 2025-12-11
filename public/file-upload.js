 const API_BASE = '/api/v1'; // Assumes served from same origin or proxy

        const log = (msg, type = 'info') => {
            const logs = document.getElementById('logs');
            const entry = document.createElement('div');
            entry.className = `log-entry ${type}`;
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
            logs.appendChild(entry);
            logs.scrollTop = logs.scrollHeight;
        };

        document.getElementById('uploadBtn').addEventListener('click', async () => {
            const token = document.getElementById('token').value.trim();
            const fileInput = document.getElementById('file');
            const file = fileInput.files[0];
            const btn = document.getElementById('uploadBtn');

            if (!token) {
                log('Error: Access Token is required.', 'error');
                return;
            }
            if (!file) {
                log('Error: Please select a file.', 'error');
                return;
            }

            btn.disabled = true;

            try {
                // 1. Generate Signed URL
                log('Step 1: Requesting Signed URL...', 'info');
                
                const signRes = await fetch(`${API_BASE}/upload/generate-signed-url`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type || 'application/octet-stream', // Fallback
                        fileSize: file.size
                    })
                });

                if (!signRes.ok) {
                    const err = await signRes.json();
                    throw new Error(err.message || 'Failed to get signed URL');
                }

                const { signedUrl, fileKey, fileId } = await signRes.json();
                log(`Signed URL received. Key: ${fileKey}, ID: ${fileId}`, 'success');

                // 2. Upload to S3
                log('Step 2: Uploading binary to S3...', 'info');
                
                const uploadRes = await fetch(signedUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream',
                        'Access-Control-Allow-Origin': 'http://localhost:5002',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    },
                    body: file
                });

                if (!uploadRes.ok) {
                    throw new Error(`S3 Upload Failed: ${uploadRes.statusText}`);
                }

                log('S3 Upload successful.', 'success');

                // 3. Confirm Upload to Backend
                log('Step 3: Confirming upload with backend...', 'info');

                const confirmRes = await fetch(`${API_BASE}/upload/confirm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        fileId: fileId
                    })
                });

                if (!confirmRes.ok) {
                    const err = await confirmRes.json();
                    throw new Error(err.message || 'Failed to confirm upload');
                }

                const confirmData = await confirmRes.json();
                log(`Upload cycle complete! Server says: ${confirmData.message} - If file is a duplicate it will be deleted from S3`, 'success');
                if (confirmData.warning) log(confirmData.warning, 'warning');
            } catch (err) {
                log(err.message, 'error');
                console.error(err);
            } finally {
                btn.disabled = false;
            }
        });