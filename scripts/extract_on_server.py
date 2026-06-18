"""
Use cPanel's Fileman API to extract the zip that's already on the server.
cpanel-standalone.zip (24MB) is confirmed at /home/cliqterc/ai.cliqter.com/
"""
import requests
import urllib3
import json

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CPANEL_HOST = "https://bst2.cloudswebserver.com:2083"
CPANEL_USER = "cliqterc"
CPANEL_PASS = "RHIA58rCSDxS-s"
REMOTE_DIR = "/home/cliqterc/ai.cliqter.com"
ZIP_FILE = "cpanel-standalone.zip"

session = requests.Session()
session.verify = False
session.auth = (CPANEL_USER, CPANEL_PASS)

def v2_api(module, func, params):
    url = f"{CPANEL_HOST}/json-api/cpanel"
    data = {
        "cpanel_jsonapi_module": module,
        "cpanel_jsonapi_func": func,
        "cpanel_jsonapi_version": "2",
        **params
    }
    r = session.post(url, data=data)
    print(f"  [{module}/{func}] {r.status_code}")
    try:
        resp = r.json()
        result = resp.get("cpanelresult", {})
        event = result.get("event", {})
        if event.get("result") == 1:
            print(f"  OK: {str(result.get('data', ''))[:300]}")
            return result.get("data")
        else:
            print(f"  Errors: {result}")
            return None
    except Exception as e:
        print(f"  Parse error: {e}")
        print(f"  Raw: {r.text[:300]}")
        return None

print("=== Extracting cpanel-standalone.zip on server ===")
print(f"ZIP location: {REMOTE_DIR}/{ZIP_FILE}")
print()

# Method 1: Fileman/extractarchive
print("Method 1: Fileman/extractarchive...")
result = v2_api("Fileman", "extractarchive", {
    "dir": REMOTE_DIR,
    "file": ZIP_FILE
})

# Method 2: Fileman/extract
if result is None:
    print("\nMethod 2: Fileman/extract...")
    result = v2_api("Fileman", "extract", {
        "dir": REMOTE_DIR,
        "files-0": f"{REMOTE_DIR}/{ZIP_FILE}",
        "destdir": REMOTE_DIR
    })

# Method 3: via full path
if result is None:
    print("\nMethod 3: Full path extract...")
    result = v2_api("Fileman", "extractarchive", {
        "dir": REMOTE_DIR,
        "file": f"{REMOTE_DIR}/{ZIP_FILE}"
    })

# Method 4: Try UAPI
if result is None:
    print("\nMethod 4: UAPI Fileman/extract_archive...")
    r = session.post(f"{CPANEL_HOST}/execute/Fileman/extract_archive", data={
        "dir": REMOTE_DIR,
        "file": ZIP_FILE
    })
    print(f"  {r.status_code}: {r.text[:400]}")

# Method 5: UAPI list to find correct function names
if result is None:
    print("\nMethod 5: Listing available Fileman functions...")
    r = session.get(f"{CPANEL_HOST}/execute/Fileman/")
    print(f"  {r.status_code}: {r.text[:500]}")

print("\n=== Also listing current server files ===")
result2 = v2_api("Fileman", "listfiles", {
    "dir": REMOTE_DIR,
    "mime": 1
})
if result2:
    print("Current files:")
    for f in result2[:30]:
        name = f.get("file") or f.get("name") or str(f)[:50]
        size = f.get("size", "?")
        print(f"  {name} ({size} bytes)")
