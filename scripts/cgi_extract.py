"""
Write a Python CGI script to cgi-bin on the server.
CGI scripts in cgi-bin are executed by Apache directly,
bypassing the Node.js reverse proxy.
"""
import requests
import urllib3
import json

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CPANEL_HOST = "https://bst2.cloudswebserver.com:2083"
CPANEL_USER = "cliqterc"
CPANEL_PASS = "RHIA58rCSDxS-s"
REMOTE_DIR = "/home/cliqterc/ai.cliqter.com"
CGI_DIR = f"{REMOTE_DIR}/cgi-bin"

session = requests.Session()
session.verify = False
session.auth = (CPANEL_USER, CPANEL_PASS)

def save_file(dir_path, filename, content):
    """Write a file using cPanel UAPI save_file_content."""
    r = session.post(f"{CPANEL_HOST}/execute/Fileman/save_file_content", data={
        "dir": dir_path,
        "file": filename,
        "content": content
    })
    try:
        d = r.json()
        ok = d.get("status") == 1
        print(f"  save {dir_path}/{filename}: {'OK' if ok else 'FAILED'} - {d.get('errors', '')}")
        return ok
    except Exception as e:
        print(f"  Error: {e}: {r.text[:200]}")
        return False

def chmod_file(dir_path, filename, mode="0755"):
    """chmod a file via UAPI."""
    r = session.post(f"{CPANEL_HOST}/execute/Fileman/change_file_permissions", data={
        "dir": dir_path,
        "file": filename,
        "permissions": mode
    })
    try:
        d = r.json()
        ok = d.get("status") == 1
        print(f"  chmod {filename}: {'OK' if ok else 'FAILED - trying v2'} - {d.get('errors','')[:80]}")
        if not ok:
            # Try v2
            r2 = session.post(f"{CPANEL_HOST}/json-api/cpanel", data={
                "cpanel_jsonapi_module": "Fileman",
                "cpanel_jsonapi_func": "chmod",
                "cpanel_jsonapi_version": "2",
                "dir": dir_path,
                "filename": filename,
                "permissions": mode
            })
            d2 = r2.json()
            print(f"  chmod v2: {d2.get('cpanelresult',{}).get('event',{})}")
    except Exception as e:
        print(f"  chmod error: {e}")

# Python CGI script that extracts the zip
CGI_SCRIPT = """#!/usr/bin/env python3
import zipfile
import os
import sys

print("Content-Type: text/plain")
print("")
print("=== EXTRACTION SCRIPT ===")
sys.stdout.flush()

zip_path = "/home/cliqterc/ai.cliqter.com/cpanel-standalone.zip"
dest_dir = "/home/cliqterc/ai.cliqter.com"

if not os.path.exists(zip_path):
    print(f"ERROR: ZIP not found at {zip_path}")
    print("Files in dir:")
    for f in os.listdir(dest_dir):
        print(f"  {f}")
    sys.exit(1)

zip_size = os.path.getsize(zip_path)
print(f"ZIP found: {zip_path} ({zip_size:,} bytes)")
sys.stdout.flush()

try:
    with zipfile.ZipFile(zip_path, 'r') as zf:
        names = zf.namelist()
        print(f"ZIP contains {len(names)} files")
        sys.stdout.flush()
        zf.extractall(dest_dir)
    
    # Delete the zip
    os.remove(zip_path)
    print(f"Extracted {len(names)} files to {dest_dir}")
    print("ZIP deleted.")
    
    # List what we have now
    print("\\nDirectory contents:")
    for item in sorted(os.listdir(dest_dir)):
        full = os.path.join(dest_dir, item)
        size = os.path.getsize(full) if os.path.isfile(full) else "DIR"
        print(f"  {item} ({size})")
    
    print("\\n=== SUCCESS ===")
except Exception as e:
    print(f"EXTRACTION FAILED: {e}")
    import traceback
    traceback.print_exc()
"""

# Also write a simple test CGI to verify CGI is working
TEST_CGI = """#!/usr/bin/env python3
import os, sys
print("Content-Type: text/plain")
print("")
print("CGI IS WORKING!")
print(f"CWD: {os.getcwd()}")
print(f"User: {os.environ.get('USER', 'unknown')}")
print(f"Python: {sys.version}")
files = os.listdir("/home/cliqterc/ai.cliqter.com")
print(f"Files in ai.cliqter.com: {files}")
"""

print("=== Writing CGI scripts to cgi-bin ===")

print("\nStep 1: Write test.cgi...")
ok1 = save_file(CGI_DIR, "test.cgi", TEST_CGI)

print("\nStep 2: Write extract.cgi...")
ok2 = save_file(CGI_DIR, "extract.cgi", CGI_SCRIPT)

print("\nStep 3: chmod test.cgi to 0755...")
chmod_file(CGI_DIR, "test.cgi", "0755")

print("\nStep 4: chmod extract.cgi to 0755...")
chmod_file(CGI_DIR, "extract.cgi", "0755")

print("\n=== Testing CGI ===")
print("Accessing https://ai.cliqter.com/cgi-bin/test.cgi ...")
try:
    r = requests.get("https://ai.cliqter.com/cgi-bin/test.cgi", timeout=30, verify=False)
    print(f"HTTP {r.status_code}: {r.text[:500]}")
    if "CGI IS WORKING" in r.text:
        print("\n✅ CGI is working! Running extraction...")
        r2 = requests.get("https://ai.cliqter.com/cgi-bin/extract.cgi", timeout=120, verify=False)
        print(f"\nExtraction result HTTP {r2.status_code}:")
        print(r2.text[:2000])
        if "SUCCESS" in r2.text:
            print("\n🎉 EXTRACTION COMPLETE!")
        else:
            print("\n⚠️ Check output above")
    else:
        print("\n⚠️ CGI not working, check response above")
except Exception as e:
    print(f"Error: {e}")

print("\nDone.")
