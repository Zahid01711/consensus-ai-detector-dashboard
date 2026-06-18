import requests, urllib3, json
urllib3.disable_warnings()
s = requests.Session()
s.verify = False
s.auth = ('cliqterc', 'RHIA58rCSDxS-s')
HOST = 'https://bst2.cloudswebserver.com:2083'

# Check what lveversion functions exist for Node.js selector
funcs = [
    'nodejs_selector_get_applications',
    'nodejs_selector_stop_application', 
    'nodejs_selector_start_application',
    'get_selector_info',
    'nodejs_selector_run_npm_install',
    'nodejs_selector_run_script',
]
print("=== lveversion function discovery ===")
for f in funcs:
    r = s.post(HOST + f'/execute/lveversion/{f}', data={'app_uri':'ai.cliqter.com'}, timeout=5)
    try:
        d = r.json()
        errs = d.get('errors', [])
        is_missing = any('could not find' in str(e).lower() for e in errs)
        print(f"lveversion/{f}: {r.status_code} - {'MISSING' if is_missing else 'EXISTS'}: {str(errs)[:100]}")
    except Exception as e:
        print(f"lveversion/{f}: {r.status_code} parse error: {e}")

# Also try the direct URL the cPanel Node.js selector page uses
print("\n=== Checking Node.js selector page API ===")
r2 = s.get(HOST + '/execute/lveversion/nodejs_selector_get_applications', timeout=10)
print(f"GET nodejs_selector_get_applications: {r2.status_code}: {r2.text[:300]}")
