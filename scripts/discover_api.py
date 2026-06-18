"""
The File Manager uses json-api/cpanel with apiversion=3 for extract.
cPanel's internal file manager AJAX uses a specific format.
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

def try_api(label, url, method="POST", data=None, params=None):
    print(f"\n[{label}]")
    try:
        if method == "POST":
            r = session.post(url, data=data, params=params, timeout=15)
        else:
            r = session.get(url, params=params, timeout=15)
        print(f"  Status: {r.status_code}")
        text = r.text[:400]
        if r.status_code not in (401, 403, 404):
            print(f"  Body: {text}")
        return r
    except Exception as e:
        print(f"  Error: {e}")
        return None

# The json-api endpoint for file manager extraction
# cPanel File Manager v3 uses: POST /cpsess.../frontend/jupiter/json-api/cpanel
# with cpanel_jsonapi_module=Fileman, func=extract

# But we need a session token. Let's try with basic auth on the json-api endpoint
try_api("json-api fileman extract basic auth",
    f"{CPANEL_HOST}/json-api/cpanel",
    data={
        "cpanel_jsonapi_module": "Fileman",
        "cpanel_jsonapi_func": "extract",
        "cpanel_jsonapi_version": "2",
        "op": "extract",
        "dir": REMOTE_DIR,
        "sourcefiles-0": f"{REMOTE_DIR}/cpanel-standalone.zip",
        "destdir": REMOTE_DIR
    })

# Try the NodejsSelector UAPI with basic auth
try_api("lveversion nodejs list basic auth",
    f"{CPANEL_HOST}/execute/NodejsSelector/list_applications",
    method="GET")

# Check what modules ARE available
try_api("list available modules",
    f"{CPANEL_HOST}/json-api/cpanel",
    data={
        "cpanel_jsonapi_module": "Fileman",
        "cpanel_jsonapi_func": "listfiles",  
        "cpanel_jsonapi_version": "2",
        "dir": REMOTE_DIR,
        "mime": "1"
    })

# The Node.js Selector URL in cPanel is: Setup Node.js App
# The API it uses is from the CloudLinux/imunify module
# Let's find the correct stop/start endpoint

# Find node app - it uses lveversion module or similar
# Try common cPanel Node.js API module names
node_modules = [
    "NodejsSelector",
    "App::Node",
    "PassengerApps",
]
for mod in node_modules:
    try_api(f"list {mod}",
        f"{CPANEL_HOST}/json-api/cpanel",
        data={
            "cpanel_jsonapi_module": mod,
            "cpanel_jsonapi_func": "list",
            "cpanel_jsonapi_version": "2",
        })

# Check what functions Fileman actually has by trying common ones
fileman_funcs = ["get_file_content", "save_file_content", "savefile", 
                  "listfiles", "list_files", "delete_files", "unlink",
                  "rename", "chmod", "mkdir", "copy", "move",
                  "compress", "extract", "extractarchive", "extract_archive"]
print("\n\n=== Testing all Fileman functions ===")
for func in fileman_funcs:
    r = session.post(f"{CPANEL_HOST}/execute/Fileman/{func}", 
                     data={"dir": REMOTE_DIR, "file": "test"}, timeout=5)
    status = r.status_code
    try:
        body = r.json()
        errors = body.get("errors", [])
        found = "not found" not in str(errors).lower()
        print(f"  {func}: {status} - {'EXISTS' if found and status==200 else 'NOT FOUND'} - {str(errors)[:80]}")
    except:
        print(f"  {func}: {status}")
