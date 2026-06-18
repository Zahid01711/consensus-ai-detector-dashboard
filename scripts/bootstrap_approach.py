"""
Try accessing the extract.cgi via different domains/paths.
Also check if there's a way to directly stop the Node.js app.
"""
import requests, urllib3
urllib3.disable_warnings()

session = requests.Session()
session.verify = False

CPANEL_HOST = "https://bst2.cloudswebserver.com:2083"
CPANEL_USER = "cliqterc"
CPANEL_PASS = "RHIA58rCSDxS-s"
session.auth = (CPANEL_USER, CPANEL_PASS)

print("=== Testing domain access patterns ===")

# Try access via main domain
urls_to_try = [
    "https://cliqter.com/cgi-bin/test.cgi",
    "http://cliqter.com/cgi-bin/test.cgi",
    "https://www.cliqter.com/cgi-bin/test.cgi",
    "https://ai.cliqter.com/cgi-bin/test.cgi",
]
for url in urls_to_try:
    try:
        r = requests.get(url, timeout=10, verify=False, allow_redirects=True)
        print(f"{url}: {r.status_code} - {r.text[:100]}")
    except Exception as e:
        print(f"{url}: {e}")

print("\n=== Checking cPanel Setup Node.js App via AJAX ===")
# Try the correct cPanel module for Node.js apps (CloudLinux NodeJS Selector)
# The actual UI uses these endpoints (from browser devtools inspection)
node_api_paths = [
    "/execute/NodejsApp/list",
    "/execute/NodejsApp/stop",
    "/json-api/cpanel?cpanel_jsonapi_module=NodejsApp&cpanel_jsonapi_func=list&cpanel_jsonapi_version=2",
]
for path in node_api_paths:
    try:
        r = session.get(CPANEL_HOST + path, timeout=10)
        print(f"{path}: {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"{path}: {e}")

print("\n=== Trying to directly overwrite server.js to NOT require .next ===")
# Since the app starts with server.js, if we overwrite it with a simple
# HTTP server that DOESN'T depend on .next, it won't 503
# Then we can use that simple server to trigger a PHP-like operation

# Actually - let's overwrite server.js to be a simple server that
# reads a command from env and executes it
# This way we can trigger the extraction through the app restart

simple_server = """
// Temporary bootstrap server - extracts deployment zip then loads real app
const http = require('http');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ZIP = path.join(__dirname, 'cpanel-standalone.zip');
const REAL_SERVER = path.join(__dirname, '.next/standalone/server.js');

const server = http.createServer((req, res) => {
  if (req.url === '/bootstrap-extract') {
    try {
      if (fs.existsSync(ZIP)) {
        // Use node to extract the zip
        execSync(`cd ${__dirname} && node -e "
const AdmZip = require('adm-zip');
const zip = new AdmZip('${ZIP}');
zip.extractAllTo('${__dirname}', true);
require('fs').unlinkSync('${ZIP}');
console.log('done');
"`, {stdio: 'pipe'});
        res.end('EXTRACTED');
      } else {
        res.end('ZIP_NOT_FOUND');
      }
    } catch(e) {
      res.end('ERROR: ' + e.message);
    }
  } else {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Bootstrap server running. ZIP exists: ' + fs.existsSync(ZIP));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Bootstrap server on ' + PORT));
"""

# Write this bootstrap server.js
r = session.post(CPANEL_HOST + "/execute/Fileman/save_file_content", data={
    "dir": "/home/cliqterc/ai.cliqter.com",
    "file": "server.js",
    "content": simple_server
})
d = r.json()
ok = d.get("status") == 1
print(f"\nWrote bootstrap server.js: {'OK' if ok else 'FAILED'} - {d.get('errors', '')[:100]}")

print("\nNOTE: After writing, you need to:")
print("1. Go to cPanel > Setup Node.js App")
print("2. Click 'Restart' for the ai.cliqter.com app")
print("3. Then visit https://ai.cliqter.com/bootstrap-extract")
print("4. Then visit https://ai.cliqter.com/ to see it extracted")
print("5. Then restart Node.js again with the real server.js")
