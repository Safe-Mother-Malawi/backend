/**
 * Keep-Alive Service
 * 
 * This script pings the backend every 10 minutes to prevent
 * Render free tier from putting the service to sleep.
 * 
 * Run this locally or deploy to a free service like:
 * - Vercel (as a cron job)
 * - GitHub Actions (scheduled workflow)
 * - Your local computer (keep terminal open)
 */

const https = require('https');

const BACKEND_URL = 'https://safemothermalawi-backend.onrender.com/api/v1/health';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

function pingBackend() {
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Pinging backend...`);
  
  https.get(BACKEND_URL, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`[${timestamp}] ✅ Backend is awake! Response:`, data);
      } else {
        console.log(`[${timestamp}] ⚠️ Backend responded with status ${res.statusCode}`);
      }
    });
  }).on('error', (err) => {
    console.error(`[${timestamp}] ❌ Failed to ping backend:`, err.message);
  });
}

// Ping immediately on start
console.log('🚀 Keep-Alive Service Started');
console.log(`📡 Pinging ${BACKEND_URL} every 10 minutes`);
console.log('⏸️  Press Ctrl+C to stop\n');

pingBackend();

// Then ping every 10 minutes
setInterval(pingBackend, PING_INTERVAL);
