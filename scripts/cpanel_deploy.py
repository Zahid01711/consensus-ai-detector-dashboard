"""
Deploy script using cPanel v2 API to:
1. Write dl.php (downloads standalone zip from tunnel)
2. Write extract.php (unzips to ai.cliqter.com)
3. Execute both via cPanel's run_live_php endpoint or cgi-bin
4. Clean up
"""
import requests
import urllib3
import json

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CPANEL_HOST = "https://bst2.cloudswebserver.com:2083"
CPANEL_USER = "cliqterc"
CPANEL_PASS = "RHIA58rCSDxS-s"
TUNNEL_URL = "https://27993173b1bbb1.lhr.life"
REMOTE_DIR = "/home/cliqterc/ai.cliqter.com"

session = requests.Session()
session.verify = False
session.auth = (CPANEL_USER, CPANEL_PASS)

def v2_api(module, func, params):
    """Call cPanel JSON API v2."""
    url = f"{CPANEL_HOST}/json-api/cpanel"
    data = {
        "cpanel_jsonapi_module": module,
        "cpanel_jsonapi_func": func,
        "cpanel_jsonapi_version": "2",
        **params
    }
    r = session.post(url, data=data)
    try:
        resp = r.json()
        result = resp.get("cpanelresult", {})
        event = result.get("event", {})
        if event.get("result") == 1:
            return result.get("data", [])
        else:
            print(f"  v2 error: {result}")
            return None
    except Exception as e:
        print(f"  parse error: {e}, body: {r.text[:300]}")
        return None

def write_file(filename, content):
    """Write a file via cPanel v2 Fileman/savefile."""
    print(f"  Writing {filename}...")
    result = v2_api("Fileman", "savefile", {
        "dir": REMOTE_DIR,
        "filename": filename,
        "content": content
    })
    if result is not None:
        print(f"  OK: {result}")
        return True
    return False

def exec_php_via_cpanel(script_path):
    """Execute a PHP script via cPanel's live execution."""
    # Try running via cPanel's Perl exec capability
    url = f"{CPANEL_HOST}/execute/Scripts/run_script"
    r = session.post(url, data={"script": script_path})
    print(f"  Run script: {r.status_code} {r.text[:200]}")

# PHP for downloading the zip
DL_PHP = f"""<?php
set_time_limit(600);
ignore_user_abort(true);
ini_set('memory_limit', '256M');
$url = '{TUNNEL_URL}/cpanel-standalone.zip';
$dest = __DIR__ . '/cpanel-standalone.zip';
$ch = curl_init($url);
$fp = fopen($dest, 'w');
curl_setopt($ch, CURLOPT_FILE, $fp);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 300);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_exec($ch);
$err = curl_error($ch);
$size = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
curl_close($ch);
fclose($fp);
$actual = file_exists($dest) ? filesize($dest) : 0;
if ($err) {{
    echo json_encode(['status'=>'error','msg'=>$err]);
}} else {{
    echo json_encode(['status'=>'ok','dest'=>$dest,'size'=>$actual]);
}}
"""

# PHP for extracting the zip
EXTRACT_PHP = """<?php
set_time_limit(300);
$zip_path = __DIR__ . '/cpanel-standalone.zip';
$dest = __DIR__;
if (!file_exists($zip_path)) {
    echo json_encode(['status'=>'error','msg'=>'zip not found at '.$zip_path]);
    exit;
}
$size = filesize($zip_path);
$zip = new ZipArchive();
$res = $zip->open($zip_path);
if ($res === TRUE) {
    $zip->extractTo($dest);
    $zip->close();
    unlink($zip_path);
    echo json_encode(['status'=>'ok','extracted_from'=>$zip_path,'zip_size'=>$size]);
} else {
    echo json_encode(['status'=>'error','msg'=>'ZipArchive open failed: '.$res]);
}
"""

print("=== Step 1: Write dl.php via cPanel API ===")
ok1 = write_file("dl.php", DL_PHP)

print("\n=== Step 2: Write extract.php via cPanel API ===")
ok2 = write_file("extract.php", EXTRACT_PHP)

if not ok1 or not ok2:
    print("\nERROR: Could not write PHP files. Cannot proceed.")
    exit(1)

print("\n=== Step 3: Execute dl.php via cPanel's exec ===")
# Try multiple execution paths
# Method A: cPanel's LivePHP (if available)
print("Trying cPanel livephp execution...")
url = f"{CPANEL_HOST}/cgi-sys/php8?{REMOTE_DIR}/dl.php"
r = session.get(url)
print(f"  {r.status_code}: {r.text[:300]}")

# Method B: Run via the correct port for Node.js app (check if php-fpm is on other port)
print("\nTrying direct php execution via cPanel API...")
result = v2_api("LangPHP", "php_get_vhost_versions", {"vhost": "ai.cliqter.com"})
print(f"  PHP info: {result}")

# Method C: Use cPanel's background job execution via Fileman
print("\nRunning via exec in a shell script via cPanel...")
# Create a shell wrapper script and try to execute it
shell_script = f"""#!/bin/bash
php {REMOTE_DIR}/dl.php > {REMOTE_DIR}/dl_output.txt 2>&1
php {REMOTE_DIR}/extract.php > {REMOTE_DIR}/extract_output.txt 2>&1
"""
write_file("deploy_run.sh", shell_script)

# Use cPanel's CommandManager if available
url2 = f"{CPANEL_HOST}/execute/CommandManager/run"
r2 = session.post(url2, data={"command": f"php {REMOTE_DIR}/dl.php"})
print(f"  CommandManager: {r2.status_code}: {r2.text[:300]}")

print("\n=== DONE ===")
print("Check the cPanel File Manager for dl_output.txt and extract_output.txt")
print("Or manually navigate to: https://bst2.cloudswebserver.com:2083 > File Manager > ai.cliqter.com")
print("and look for those output files.")
