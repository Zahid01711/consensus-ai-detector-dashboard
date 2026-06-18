"""
Read files using correct cPanel UAPI format (dir + filename separately)
and find the right extract API call.
"""
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CPANEL_HOST = "https://bst2.cloudswebserver.com:2083"
CPANEL_USER = "cliqterc"
CPANEL_PASS = "RHIA58rCSDxS-s"
REMOTE_DIR = "/home/cliqterc/ai.cliqter.com"

session = requests.Session()
session.verify = False
session.auth = (CPANEL_USER, CPANEL_PASS)

def uapi(func, params):
    """Call UAPI Fileman endpoint."""
    r = session.post(f"{CPANEL_HOST}/execute/Fileman/{func}", data=params)
    print(f"  [{func}] {r.status_code}")
    try:
        d = r.json()
        if d.get("status") == 1:
            return d.get("data")
        else:
            print(f"    Error: {d.get('errors')}")
    except Exception as e:
        print(f"    Parse err: {e}: {r.text[:200]}")
    return None

# Read server.js using dir + filename separately
print("Reading server.js...")
result = uapi("get_file_content", {"dir": REMOTE_DIR, "file": "server.js"})
if result:
    print(f"server.js:\n{result.get('content', '')}")

print("\nReading stderr.log...")
result = uapi("get_file_content", {"dir": REMOTE_DIR, "file": "stderr.log"})
if result:
    content = result.get("content", "")
    print(content[-2000:] if len(content) > 2000 else content)

print("\nReading error_log...")
result = uapi("get_file_content", {"dir": REMOTE_DIR, "file": "error_log"})
if result:
    print(result.get("content", ""))

# Try to find the extract function in UAPI
print("\n\nTrying extract_archive via UAPI...")
result = uapi("extract_archive", {
    "dir": REMOTE_DIR, 
    "file": "cpanel-standalone.zip",
    "extract_dir": REMOTE_DIR
})
if result:
    print(f"Extract result: {result}")

# Try autoextract
print("\nTrying autoextract...")
result = uapi("autoextract", {
    "dir": REMOTE_DIR,
    "file": "cpanel-standalone.zip"
})

# Try UAPI metadata to discover functions
print("\nListing all UAPI Fileman functions...")
r = session.get(f"{CPANEL_HOST}/execute/")
print(f"API root: {r.status_code}: {r.text[:500]}")

# The cPanel File Manager uses its own Ajax endpoints
# Let's try the filemanager ajax endpoint directly
print("\n\nTrying filemanager ajax extract...")
ajax_url = f"{CPANEL_HOST}/cpsess{CPANEL_PASS}/frontend/jupiter/filemanager/index.html"

# The file manager uses this endpoint for extraction
extract_url = f"{CPANEL_HOST}/execute/Fileman/extract_archive"
r2 = session.post(extract_url, data={
    "dir": REMOTE_DIR,
    "file": "cpanel-standalone.zip"  
})
print(f"extract_archive UAPI: {r2.status_code}: {r2.text[:400]}")
