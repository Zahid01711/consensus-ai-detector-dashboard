"""
Try all cPanel API methods to execute the dl.php and extract.php scripts
that are already on the server.
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

def try_exec(label, url, method="GET", data=None):
    print(f"\n[{label}]")
    try:
        if method == "GET":
            r = session.get(url, timeout=30)
        else:
            r = session.post(url, data=data, timeout=30)
        print(f"  {r.status_code}: {r.text[:400]}")
        return r
    except Exception as e:
        print(f"  Error: {e}")
        return None

# Try cPanel's exec endpoints to run the PHP scripts
php_path = f"{REMOTE_DIR}/dl.php"

# 1. Try the cPanel Execute API for running scripts
try_exec("UAPI Scripts/run", 
    f"{CPANEL_HOST}/execute/Scripts/run",
    "POST", {"script": php_path})

# 2. Try cPanel's php exec endpoint
try_exec("cgi-sys/php",
    f"{CPANEL_HOST}/cgi-sys/php.cgi?{php_path}")

# 3. The background task via cPanel
try_exec("UAPI Batch/strict",
    f"{CPANEL_HOST}/execute/Batch/strict",
    "POST", {"command": [f"php {php_path}"]})

# 4. Try accessing via the main domain's PHP handler (port 80)
try_exec("HTTP ai.cliqter.com/dl.php",
    "https://ai.cliqter.com/dl.php",
    "GET")

# 5. Try via Softaculous exec or other
try_exec("UAPI SubDomain list",
    f"{CPANEL_HOST}/execute/SubDomain/listsubdomains")

# 6. Check if there's a way to access PHP via a different port
try_exec("cPanel port 2082",
    f"http://bst2.cloudswebserver.com:2082/cgi-sys/php.cgi?{php_path}")

print("\n\nChecking what files are on server...")
url = f"{CPANEL_HOST}/json-api/cpanel"
r = session.post(url, data={
    "cpanel_jsonapi_module": "Fileman",
    "cpanel_jsonapi_func": "listfiles",
    "cpanel_jsonapi_version": "2",
    "dir": REMOTE_DIR,
    "mime": 1
})
try:
    data = r.json()
    files = data.get("cpanelresult", {}).get("data", [])
    print(f"Files in {REMOTE_DIR}:")
    for f in files[:30]:
        name = f.get("file") or f.get("name") or str(f)[:50]
        size = f.get("size", "")
        print(f"  {name} ({size})")
except:
    print(r.text[:500])
