// Bootstrap server.js - extracts cpanel-standalone.zip on startup, then runs real app
// Uses ONLY built-in Node.js modules (no npm install needed)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const ZIP = path.join(DIR, 'cpanel-standalone.zip');
const PORT = process.env.PORT || 3000;

console.log('=== Bootstrap server starting ===');
console.log('DIR:', DIR);
console.log('ZIP exists:', fs.existsSync(ZIP));

// Start a minimal HTTP server immediately so cPanel doesn't kill us
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bootstrap complete. App restarting...\n');
});

server.listen(PORT, () => {
  console.log('Bootstrap HTTP server listening on port', PORT);

  if (!fs.existsSync(ZIP)) {
    console.log('No zip found - exiting bootstrap. App should already be deployed.');
    return;
  }

  console.log('ZIP found! Extracting using unzip...');
  try {
    // unzip is available on all Linux servers
    execFileSync('unzip', ['-o', ZIP, '-d', DIR], { stdio: 'inherit' });
    fs.unlinkSync(ZIP);
    console.log('Extraction complete! ZIP deleted.');
  } catch (e) {
    console.error('unzip failed:', e.message);
    // Fallback: try python3
    try {
      execFileSync('python3', ['-c',
        `import zipfile,os; z=zipfile.ZipFile('${ZIP}'); z.extractall('${DIR}'); z.close(); os.remove('${ZIP}')`
      ], { stdio: 'inherit' });
      console.log('python3 extraction complete!');
    } catch (e2) {
      console.error('python3 also failed:', e2.message);
    }
  }

  // Now check if the real standalone server exists
  const standaloneServer = path.join(DIR, 'standalone', '.next', 'standalone', 'server.js');
  const altServer = path.join(DIR, '.next', 'standalone', 'server.js');

  let realServer = null;
  if (fs.existsSync(standaloneServer)) {
    realServer = standaloneServer;
  } else if (fs.existsSync(altServer)) {
    realServer = altServer;
  }

  if (realServer) {
    console.log('Real server found at:', realServer);
    console.log('Switching to real server...');
    server.close(() => {
      require(realServer);
    });
  } else {
    console.log('Real server not found yet. Contents of DIR:');
    fs.readdirSync(DIR).forEach(f => console.log(' ', f));
    console.log('Bootstrap server staying up until restart.');
  }
});
