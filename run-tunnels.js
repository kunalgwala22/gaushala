const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRONTEND_ENV_PATH = path.join(__dirname, 'frontend', '.env');

// Helper to extract URL from tunnel output
function extractUrl(data, service) {
  const text = data.toString();
  if (service === 'localhost.run') {
    // Looks like: "... https://xxx.lhr.life ..."
    const match = text.match(/https:\/\/[a-zA-Z0-9-.]+\.lhr\.life/);
    return match ? match[0] : null;
  } else if (service === 'serveo') {
    // Looks like: "Forwarding HTTP traffic from https://xxx.serveousercontent.com"
    const match = text.match(/https:\/\/[a-zA-Z0-9-.]+\.(serveousercontent\.com|serveo\.net)/);
    return match ? match[0] : null;
  }
  return null;
}

function startTunnel(port, service, callback) {
  let cmd, args;
  if (service === 'localhost.run') {
    cmd = 'ssh';
    args = ['-o', 'StrictHostKeyChecking=no', '-R', `80:localhost:${port}`, 'nokey@localhost.run'];
  } else {
    cmd = 'ssh';
    args = ['-o', 'StrictHostKeyChecking=no', '-R', `80:localhost:${port}`, 'serveo.net'];
  }

  console.log(`[${service}] Starting tunnel for port ${port}...`);
  const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
  
  let urlFound = false;
  let timeout = setTimeout(() => {
    if (!urlFound) {
      console.log(`[${service}] Timeout waiting for port ${port} URL.`);
      proc.kill();
      callback(new Error('Timeout'));
    }
  }, 12000);

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
  proc.stderr.on('data', (data) => {
    // Serveo sometimes prints info to stderr
    onData(data);
  });

  proc.on('close', (code) => {
    if (!urlFound) {
      clearTimeout(timeout);
      callback(new Error(`Process closed with code ${code}`));
    }
  });

  proc.on('error', (err) => {
    if (!urlFound) {
      clearTimeout(timeout);
      callback(err);
    }
  });
}

function startTunnelWithFallback(port, callback) {
  startTunnel(port, 'localhost.run', (err, url, proc) => {
    if (err) {
      console.log(`localhost.run failed for port ${port}. Trying serveo.net fallback...`);
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

// Main execution flow
let apiProc, portalProc;

console.log('Starting Shree Sawariya Seth Gaushala Tunnel Manager...');

startTunnelWithFallback(5001, (err, apiUrl, proc, service) => {
  if (err) {
    console.error('Failed to tunnel API:', err.message);
    process.exit(1);
  }
  apiProc = proc;

  // Write VITE_API_URL to frontend/.env
  console.log(`Writing API URL to ${FRONTEND_ENV_PATH}...`);
  fs.writeFileSync(FRONTEND_ENV_PATH, `VITE_API_URL=${apiUrl}/api\n`);
  console.log('API URL written successfully. Vite should reload.');

  // Now start frontend tunnel
  // We try the same service first for consistency
  startTunnel(5174, service, (err2, portalUrl, proc2) => {
    if (err2) {
      console.log(`Failed to tunnel portal with ${service}. Trying fallback...`);
      const fallbackService = service === 'localhost.run' ? 'serveo' : 'localhost.run';
      startTunnel(5174, fallbackService, (err3, portalUrl2, proc3) => {
        if (err3) {
          console.error('Failed to tunnel Portal on both services:', err3.message);
          apiProc.kill();
          process.exit(1);
        }
        portalProc = proc3;
        printUrls(apiUrl, portalUrl2);
      });
    } else {
      portalProc = proc2;
      printUrls(apiUrl, portalUrl);
    }
  });
});

function printUrls(apiUrl, portalUrl) {
  console.log('\n==================================================');
  console.log('  SHREE SAWARIYA SETH GAUSHALA PUBLIC TUNNELS     ');
  console.log('==================================================');
  console.log(`  API (Backend) URL : ${apiUrl}`);
  console.log(`  Portal (Frontend) : ${portalUrl}`);
  console.log('==================================================');
  console.log('Tunnels are running. Press Ctrl+C to terminate.');
}

// Cleanup on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

function cleanup() {
  console.log('\nShutting down tunnels...');
  if (apiProc) apiProc.kill();
  if (portalProc) portalProc.kill();
  process.exit(0);
}
