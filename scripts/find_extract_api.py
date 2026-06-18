"""
The cPanel File Manager frontend uses specific AJAX endpoints.
Let's find and call the exact endpoint it uses for extraction.
Also try the lveversion Node.js selector endpoints.
"""
import requests
import urllib3
import json

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CPANEL_HOST = "https://bst2.cloudswebserver.com:2083"
CPANEL_USER = "cliqterc"
CPANEL_PASS = "RHIA58rCSDxS-s"
REMOTE_DIR = "/home/cliqterc/ai.cliqter.com"

session = requests.Session()
session.verify = False
session.auth = (CPANEL_USER, CPANEL_PASS)

# First, get a cPanel session token by logging in
print("Getting cPanel session token...")
login_url = f"{CPANEL_HOST}/login/"
login_data = {"user": CPANEL_USER, "pass": CPANEL_PASS, "goto_uri": "/"}
r = session.post(login_url, data=login_data, allow_redirects=False)
print(f"Login: {r.status_code}")
# The session cookies are automatically stored in session

# Get security token from cPanel
token_r = session.get(f"{CPANEL_HOST}/cpsess{{}}/frontend/jupiter/", allow_redirects=True)
print(f"Token page: {token_r.status_code}, URL: {token_r.url}")

# Extract cpsess token from URL
import re
token_match = re.search(r'cpsess(\w+)', token_r.url)
token = token_match.group(1) if token_match else ""
print(f"Security token: {token[:20]}...")

BASE = f"{CPANEL_HOST}/cpsess{token}"

# The File Manager uses these endpoints (found from browser devtools):
# POST /execute/Fileman/extract_archive - UAPI
# The correct endpoint for extraction via File Manager Ajax is the same UAPI

# Let's try the correct Fileman UAPI endpoints that actually exist
endpoints_to_try = [
    ("Fileman/extractarchive", {"dir": REMOTE_DIR, "file": "cpanel-standalone.zip"}),
    ("Fileman/extract_archive", {"dir": REMOTE_DIR, "file": "cpanel-standalone.zip"}),
    ("Fileman/viewfile", {"dir": REMOTE_DIR, "file": "cpanel-standalone.zip"}),
]

for endpoint, params in endpoints_to_try:
    r = session.post(f"{CPANEL_HOST}/execute/{endpoint}", data=params)
    print(f"\n[{endpoint}] {r.status_code}: {r.text[:200]}")

# Try the File Manager specific AJAX URL with session
print("\n\nTrying filemanager-specific AJAX with session...")
ajax_endpoints = [
    f"{BASE}/frontend/jupiter/filemanager/index.html",
    f"{BASE}/frontend/jupiter/json-api/fileman/extract",
]
for url in ajax_endpoints:
    try:
        r = session.post(url, data={
            "dir": REMOTE_DIR,
            "file": "cpanel-standalone.zip"
        }, timeout=10)
        print(f"\n[{url[-50:]}] {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"\n[{url[-50:]}] Error: {e}")

# Check Node.js app status via the lvenode API
print("\n\nChecking Node.js selector...")
lve_endpoints = [
    "lveversion/nodejs-selector-get-applications",
    "NodejsSelector/list",
    "CloudLinux/nodejs_selector_get_applications",
]
for ep in lve_endpoints:
    r = session.get(f"{CPANEL_HOST}/execute/{ep}")
    print(f"\n[{ep}] {r.status_code}: {r.text[:300]}")
