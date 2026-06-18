"""
cPanel Auto-Deploy Script for Consensus AI Detector Dashboard
=============================================================
Uses only Python stdlib (no pip needed).
What it does:
  1. Deletes ALL existing files in the target cPanel directory (clean slate)
  2. Uploads the new standalone zip via cPanel UAPI
  3. Extracts the zip in-place
  4. Cleans up the zip from the server

Usage:
  python scripts/cpanel_upload_deploy.py

Edit the CONFIG block below if needed.
"""

import urllib.request
import urllib.parse
import ssl
import base64
import json
import os
import sys

# ─── CONFIG ────────────────────────────────────────────────────────────────────
CPANEL_HOST     = "bst2.cloudswebserver.com"
CPANEL_PORT     = 2083
CPANEL_USER     = "cliqterc"          # cPanel username
CPANEL_PASS     = ""                  # ← FILL THIS IN (your cPanel password)

# Target directory (relative to home dir, i.e. /home/cliqterc/)
REMOTE_DIR      = "ai.cliqter.com"   # The subdomain folder

# Local zip to upload (the pre-built standalone)
LOCAL_ZIP       = "cpanel-standalone-final.zip"
ZIP_NAME        = "deploy_new.zip"   # Temporary name on the server
# ───────────────────────────────────────────────────────────────────────────────


def build_base_url():
    return f"https://{CPANEL_HOST}:{CPANEL_PORT}"


def make_auth_header(user, password):
    creds = f"{user}:{password}"
    token = base64.b64encode(creds.encode()).decode()
    return {"Authorization": f"Basic {token}"}


def uapi(user, password, module, func, params=None):
    """Call a cPanel UAPI endpoint and return parsed JSON."""
    base = build_base_url()
    query = urllib.parse.urlencode(params or {})
    url = f"{base}/execute/{module}/{func}?{query}"

    headers = make_auth_header(user, password)
    req = urllib.request.Request(url, headers=headers)

    # Ignore SSL cert issues on shared hosting
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
            data = json.loads(resp.read().decode())
            return data
    except Exception as e:
        print(f"  [ERROR] UAPI call failed: {e}")
        return None


def list_remote_dir(user, password, remote_dir):
    """Return list of items in the remote directory."""
    result = uapi(user, password, "Fileman", "list_files", {
        "dir": remote_dir,
        "include_hidden": 1,
    })
    if result and result.get("status") == 1:
        return result.get("data", {}).get("entries", [])
    return []


def delete_remote_dir_contents(user, password, remote_dir):
    """Delete every file and folder inside the remote directory."""
    print(f"\n[Step 1] Listing contents of /{remote_dir} ...")
    entries = list_remote_dir(user, password, remote_dir)

    if not entries:
        print("  Directory is empty or couldn't be listed — skipping delete step.")
        return

    # Build list of paths to delete
    paths = []
    for entry in entries:
        name = entry.get("file") or entry.get("name", "")
        if name in (".", "..") or not name:
            continue
        paths.append(f"{remote_dir}/{name}")

    if not paths:
        print("  No items to delete.")
        return

    print(f"  Found {len(paths)} items. Deleting...")

    # cPanel delete API accepts a JSON array of paths
    # We must encode as multiple "path" params
    base = build_base_url()
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    # Build path list as repeated query params
    params = "&".join(f"path={urllib.parse.quote(p)}" for p in paths)
    url = f"{base}/execute/Fileman/delete_files?{params}"

    headers = make_auth_header(user, password)
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=120) as resp:
            result = json.loads(resp.read().decode())
            if result.get("status") == 1:
                print(f"  ✅ Deleted {len(paths)} items successfully.")
            else:
                errors = result.get("errors", [])
                print(f"  ⚠️  Delete returned status 0. Errors: {errors}")
    except Exception as e:
        print(f"  [ERROR] Delete request failed: {e}")


def upload_zip(user, password, local_zip_path, remote_dir, zip_name):
    """Upload the zip file using cPanel's UAPI upload endpoint (multipart)."""
    print(f"\n[Step 2] Uploading {os.path.basename(local_zip_path)} ({os.path.getsize(local_zip_path)/1024/1024:.1f} MB)...")

    boundary = "----CPanelDeployBoundary7x"
    base = build_base_url()

    # cPanel file upload via UAPI Fileman/upload_files
    url = f"{base}/execute/Fileman/upload_files?dir={urllib.parse.quote(remote_dir)}&overwrite=1"
    headers = make_auth_header(user, password)

    with open(local_zip_path, "rb") as f:
        file_data = f.read()

    # Multipart body
    part_header = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file-1"; filename="{zip_name}"\r\n'
        f"Content-Type: application/zip\r\n\r\n"
    ).encode()
    part_footer = f"\r\n--{boundary}--\r\n".encode()

    body = part_header + file_data + part_footer

    headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    headers["Content-Length"] = str(len(body))

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=300) as resp:
            result = json.loads(resp.read().decode())
            if result.get("status") == 1:
                print(f"  ✅ Upload successful.")
                return True
            else:
                print(f"  ❌ Upload failed: {result.get('errors', result)}")
                return False
    except Exception as e:
        print(f"  [ERROR] Upload request failed: {e}")
        return False


def extract_zip(user, password, remote_dir, zip_name):
    """Tell cPanel to extract the uploaded zip."""
    print(f"\n[Step 3] Extracting {zip_name} on server...")

    result = uapi(user, password, "Fileman", "extract_a_archive", {
        "dir": remote_dir,
        "files": zip_name,
    })

    if result and result.get("status") == 1:
        print(f"  ✅ Extraction complete.")
        return True
    else:
        errors = result.get("errors", []) if result else ["No response"]
        print(f"  ❌ Extraction failed: {errors}")
        return False


def delete_remote_file(user, password, remote_dir, filename):
    """Delete the zip from the server after extraction."""
    print(f"\n[Step 4] Cleaning up uploaded zip from server...")
    result = uapi(user, password, "Fileman", "delete_files", {
        "path": f"{remote_dir}/{filename}",
    })
    if result and result.get("status") == 1:
        print(f"  ✅ Cleaned up {filename}.")
    else:
        print(f"  ⚠️  Could not delete zip (non-critical): {result}")


def main():
    # ── Validation ──────────────────────────────────────────────────────────
    if not CPANEL_PASS:
        print("ERROR: CPANEL_PASS is empty. Edit the CONFIG block at the top of this script.")
        sys.exit(1)

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zip_path = os.path.join(project_root, LOCAL_ZIP)

    if not os.path.exists(zip_path):
        print(f"ERROR: Zip file not found: {zip_path}")
        print("Run: powershell -ExecutionPolicy Bypass -File .\\scripts\\build-and-package-cpanel.ps1 -OutputZip cpanel-standalone-final.zip")
        sys.exit(1)

    print("=" * 60)
    print("  Consensus AI Detector — cPanel Auto-Deploy")
    print("=" * 60)
    print(f"  Host : {CPANEL_HOST}:{CPANEL_PORT}")
    print(f"  User : {CPANEL_USER}")
    print(f"  Dir  : /home/{CPANEL_USER}/{REMOTE_DIR}")
    print(f"  ZIP  : {os.path.basename(zip_path)} ({os.path.getsize(zip_path)/1024/1024:.1f} MB)")
    print("=" * 60)

    # ── Step 1: Delete old files ─────────────────────────────────────────────
    delete_remote_dir_contents(CPANEL_USER, CPANEL_PASS, REMOTE_DIR)

    # ── Step 2: Upload new zip ───────────────────────────────────────────────
    ok = upload_zip(CPANEL_USER, CPANEL_PASS, zip_path, REMOTE_DIR, ZIP_NAME)
    if not ok:
        print("\n[FATAL] Upload failed. Aborting deployment.")
        sys.exit(1)

    # ── Step 3: Extract on server ────────────────────────────────────────────
    ok = extract_zip(CPANEL_USER, CPANEL_PASS, REMOTE_DIR, ZIP_NAME)
    if not ok:
        print("\n[WARNING] Extraction may have failed. Check cPanel File Manager.")

    # ── Step 4: Delete zip from server ───────────────────────────────────────
    delete_remote_file(CPANEL_USER, CPANEL_PASS, REMOTE_DIR, ZIP_NAME)

    print("\n" + "=" * 60)
    print("  ✅ DEPLOYMENT COMPLETE")
    print("=" * 60)
    print("\nNext steps in cPanel (one time only):")
    print("  1. Go to cPanel → Setup Node.js App")
    print(f"  2. App root: {REMOTE_DIR}  |  Startup file: server.js")
    print("  3. Add environment variables (see scripts/CPANEL_DEPLOY_GUIDE.md)")
    print(f"     DATABASE_URL = file:./prisma/prod.db")
    print(f"     NODE_ENV     = production")
    print(f"     JWT_SECRET   = <your secret>")
    print(f"     ENCRYPTION_KEY = <64 hex chars>")
    print(f"     SAPLING_API_KEY = 2V13OCMOO5RTBKUHCPT4F7IY6CWLK9W6")
    print(f"     WASITAIGENERATED_API_KEY = wai_cvkrqASo5b27rld2h4MFgo8cu7zCSuiS")
    print("  4. Click STOP → START (the server auto-creates DB + seeds on first boot)")
    print(f"  5. Visit: https://ai.cliqter.com")
    print()


if __name__ == "__main__":
    main()
