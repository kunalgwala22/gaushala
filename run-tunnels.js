const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const FRONTEND_ENV_PATH = path.join(__dirname, 'frontend', '.env');

// Helper to extract URL from tunnel output
function extractUrl(data, service) {
  const text = data.toString();
  if (service === 'localhost.run') {
    const match = text.match(/https:\/\/[a-zA-Z0-9-.]+\.lhr\.life/);
    return match ? match[0] : null;
  } else if (service === 'serveo') {
    const match = text.match(/https:\/\/[a-zA-Z0-9-.]+\.(serveousercontent\.com|serveo\.net)/);
    return match ? match[0] : null;
  }
  return null;
}

let apiProc = null;
let portalProc = null;
let apiService = 'localhost.run';
let portalService = 'localhost.run';
let currentApiUrl = '';
let currentPortalUrl = '';

function startTunnel(port, service, callback) {
  let cmd = 'ssh';
  let args = [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=10',
    '-o', 'ServerAliveCountMax=3'
  ];

  if (service === 'localhost.run') {
    args.push('-R', `80:localhost:${port}`, 'nokey@localhost.run');
  } else {
    args.push('-R', `80:localhost:${port}`, 'serveo.net');
  }

  console.log(`[${service}] Starting tunnel for port ${port}...`);
  const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
  
  let urlFound = false;
  let timeout = setTimeout(() => {
    if (!urlFound) {
      console.log(`[${service}] Timeout waiting for port ${port} URL.`);
      proc.kill('SIGKILL');
      callback(new Error('Timeout'));
    }
  }, 15000);

  const onData = (data) => {
    const url = extractUrl(data, service);
    if (url && !urlFound) {
      urlFound = true;
      clearTimeout(timeout);
      console.log(`[${service}] Found URL for port ${port}: ${url}`);
      callback(null, url, proc);
    }
  };

  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);

  proc.on('close', (code) => {
    if (!urlFound) {
      clearTimeout(timeout);
      callback(new Error(`Process closed with code ${code}`));
    } else {
      console.log(`[${service}] Tunnel process for port ${port} closed (code ${code}).`);
      handleExit(port);
    }
  });

  proc.on('error', (err) => {
    if (!urlFound) {
      clearTimeout(timeout);
      callback(err);
    } else {
      console.error(`[${service}] Tunnel process error for port ${port}:`, err);
    }
  });
}

function startTunnelWithFallback(port, callback) {
  startTunnel(port, 'localhost.run', (err, url, proc) => {
    if (err) {
      console.log(`localhost.run failed for port ${port}. Trying serveo.net...`);
      startTunnel(port, 'serveo', (err2, url2, proc2) => {
        if (err2) {
          callback(new Error(`Both tunnel services failed for port ${port}: ${err2.message}`));
        } else {
          callback(null, url2, proc2, 'serveo');
        }
      });
    } else {
      callback(null, url, proc, 'localhost.run');
    }
  });
}

function handleExit(port) {
  setTimeout(() => {
    console.log(`Attempting to restart tunnel for port ${port}...`);
    if (port === 5001) {
      startTunnelWithFallback(5001, (err, url, proc, service) => {
        if (!err) {
          apiProc = proc;
          apiService = service;
          currentApiUrl = url;
          console.log(`Writing API URL to ${FRONTEND_ENV_PATH}...`);
          fs.writeFileSync(FRONTEND_ENV_PATH, `VITE_API_URL=${url}/api\n`);
          printUrls();
        }
      });
    } else {
      startTunnel(5174, portalService, (err, url, proc) => {
        if (!err) {
          portalProc = proc;
          currentPortalUrl = url;
          printUrls();
        } else {
          const otherService = portalService === 'localhost.run' ? 'serveo' : 'localhost.run';
          startTunnel(5174, otherService, (err2, url2, proc2) => {
            if (!err2) {
              portalProc = proc2;
              portalService = otherService;
              currentPortalUrl = url2;
              printUrls();
            }
          });
        }
      });
    }
  }, 5000);
}

function printUrls() {
  console.log('\n==================================================');
  console.log('  SHREE SAWARIYA SETH GAUSHALA PUBLIC TUNNELS     ');
  console.log('==================================================');
  console.log(`  API (Backend) URL : ${currentApiUrl}`);
  console.log(`  Portal (Frontend) : ${currentPortalUrl}`);
  console.log('==================================================');
  console.log('Tunnels are running. Press Ctrl+C to terminate.');
}

function checkUrlHealth(url, callback) {
  if (!url) return callback(false);
  
  const client = url.startsWith('https') ? https : http;
  
  const req = client.get(url, { timeout: 8000 }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 503 && body.includes('no tunnel here')) {
        callback(false);
      } else if (res.statusCode >= 500) {
        callback(false);
      } else {
        callback(true);
      }
    });
  });
  
  req.on('error', () => {
    callback(false);
  });
  
  req.on('timeout', () => {
    req.destroy();
    callback(false);
  });
}

// Start API Tunnel
startTunnelWithFallback(5001, (err, apiUrl, proc, service) => {
  if (err) {
    console.error('Failed to tunnel API:', err.message);
    process.exit(1);
  }
  apiProc = proc;
  apiService = service;
  currentApiUrl = apiUrl;

  console.log(`Writing API URL to ${FRONTEND_ENV_PATH}...`);
  fs.writeFileSync(FRONTEND_ENV_PATH, `VITE_API_URL=${apiUrl}/api\n`);

  // Start Portal Tunnel
  startTunnel(5174, service, (err2, portalUrl, proc2) => {
    if (err2) {
      const fallbackService = service === 'localhost.run' ? 'serveo' : 'localhost.run';
      startTunnel(5174, fallbackService, (err3, portalUrl2, proc3) => {
        if (err3) {
          console.error('Failed to tunnel Portal:', err3.message);
          apiProc.kill();
          process.exit(1);
        }
        portalProc = proc3;
        portalService = fallbackService;
        currentPortalUrl = portalUrl2;
        printUrls();
      });
    } else {
      portalProc = proc2;
      currentPortalUrl = portalUrl;
      printUrls();
    }
  });
});

// Periodic Health Checker (Runs every 30 seconds)
setInterval(() => {
  if (currentApiUrl && apiProc) {
    checkUrlHealth(currentApiUrl + '/api/auth/status', (ok) => {
      if (!ok) {
        console.log(`[HEALTH CHECK] API Tunnel (${currentApiUrl}) is dead. Restarting...`);
        apiProc.kill('SIGKILL');
      }
    });
  }
  
  if (currentPortalUrl && portalProc) {
    checkUrlHealth(currentPortalUrl, (ok) => {
      if (!ok) {
        console.log(`[HEALTH CHECK] Portal Tunnel (${currentPortalUrl}) is dead. Restarting...`);
        portalProc.kill('SIGKILL');
      }
    });
  }
}, 30000);

// Cleanup on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

function cleanup() {
  console.log('\nShutting down tunnels...');
  if (apiProc) apiProc.kill('SIGKILL');
  if (portalProc) portalProc.kill('SIGKILL');
  process.exit(0);
}
