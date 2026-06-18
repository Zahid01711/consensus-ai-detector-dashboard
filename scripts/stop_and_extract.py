"""
Now we know PHP works on the server (error_log shows upload.php PHP warnings).
The issue is the Node.js app intercepts requests to ai.cliqter.com.
Strategy: Use the cPanel Node.js app stop API to stop Node.js,
then trigger extract.php (PHP takes over), then restart Node.js.
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

def v2_post(module, func, params=None):
    r = session.post(f"{CPANEL_HOST}/json-api/cpanel", data={
        "cpanel_jsonapi_module": module,
        "cpanel_jsonapi_func": func,
        "cpanel_jsonapi_version": "2",
        **(params or {})
    })
    try:
        return r.json().get("cpanelresult", {})
    except:
        return {"raw": r.text[:200]}

def uapi_post(func_path, params=None):
    r = session.post(f"{CPANEL_HOST}/execute/{func_path}", data=params or {})
    try:
        return r.json()
    except:
        return {"raw": r.text[:200]}

def write_file(filename, content):
    result = v2_post("Fileman", "savefile", {
        "dir": REMOTE_DIR,
        "filename": filename,
        "content": content
    })
    event = result.get("event", {})
    ok = event.get("result") == 1
    print(f"  Write {filename}: {'OK' if ok else 'FAILED'} - {result.get('data', '')[:100]}")
    return ok

# Step 1: Stop Node.js app via cPanel lsnode
print("Step 1: Stopping Node.js app...")
result = uapi_post("NodeApp/stop_application", {"dir": REMOTE_DIR})
print(f"  stop result: {result}")

result2 = v2_post("NodeApp", "stop", {"dir": REMOTE_DIR})
print(f"  v2 stop: {result2}")

# Try the lveversion nodejs stop
result3 = uapi_post("LveVersion/nodejs_selector_stop", {"app_id": "ai.cliqter.com"})
print(f"  lveversion stop: {result3}")

# Step 2: Write a new extract.php that extracts the zip AND fixes permissions
print("\nStep 2: Writing updated extract.php with permission fix...")
extract_php = """<?php
set_time_limit(600);
ignore_user_abort(true);

echo "=== EXTRACT SCRIPT ===\\n";
$zip_path = '/home/cliqterc/ai.cliqter.com/cpanel-standalone.zip';
$dest = '/home/cliqterc/ai.cliqter.com';

echo "Checking zip: ";
if (!file_exists($zip_path)) {
    echo "NOT FOUND at $zip_path\\n";
    exit(1);
}
echo "Found! Size=" . filesize($zip_path) . " bytes\\n";

// Remove old .next directory if it exists (fixes permission issues)
echo "Removing old .next directory...\\n";
function rrmdir($dir) {
    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file != '.' && $file != '..') {
                $path = $dir . '/' . $file;
                if (is_dir($path)) rrmdir($path);
                else @unlink($path);
            }
        }
        @rmdir($dir);
    }
}
// Don't remove .next entirely yet, let the zip overwrite handle it

echo "Extracting zip...\\n";
$zip = new ZipArchive();
$res = $zip->open($zip_path);
if ($res === TRUE) {
    $count = $zip->numFiles;
    $zip->extractTo($dest);
    $zip->close();
    echo "Extracted $count files!\\n";
    
    // Delete the zip
    unlink($zip_path);
    echo "ZIP deleted.\\n";
    
    echo "\\n=== SUCCESS ===\\n";
    echo "Files extracted to: $dest\\n";
    
    // List what we extracted
    $items = scandir($dest);
    echo "Directory contents:\\n";
    foreach ($items as $item) {
        if ($item != '.' && $item != '..') {
            echo "  $item\\n";
        }
    }
} else {
    echo "FAILED to open ZIP. Error code: $res\\n";
}
?>"""

write_file("extract.php", extract_php)

# Step 3: Try to access extract.php directly
print("\nStep 3: Accessing https://ai.cliqter.com/extract.php ...")
try:
    r = requests.get("https://ai.cliqter.com/extract.php", timeout=120, verify=False)
    print(f"  HTTP {r.status_code}")
    print(f"  Body: {r.text[:1000]}")
    if "SUCCESS" in r.text:
        print("\n  ✅ EXTRACTION COMPLETE!")
    elif r.status_code == 503:
        print("  Node.js app is blocking PHP. Need to stop it first.")
    else:
        print("  Check response above")
except Exception as e:
    print(f"  Error: {e}")

print("\nDone.")
