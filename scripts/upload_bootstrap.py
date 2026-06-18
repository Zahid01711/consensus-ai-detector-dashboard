"""
Write bootstrap_server.js as server.js on the cPanel server.
Then instruct the user to click Restart in the Node.js App UI.
The bootstrap will run on startup and extract the zip automatically.
"""
import requests, urllib3

urllib3.disable_warnings()
session = requests.Session()
session.verify = False
session.auth = ('cliqterc', 'RHIA58rCSDxS-s')
HOST = 'https://bst2.cloudswebserver.com:2083'
DIR = '/home/cliqterc/ai.cliqter.com'

bootstrap_js = open('scripts/bootstrap_server.js').read()

print("Writing bootstrap server.js to server...")
r = session.post(f"{HOST}/execute/Fileman/save_file_content", data={
    "dir": DIR,
    "file": "server.js",
    "content": bootstrap_js
})
d = r.json()
ok = d.get("status") == 1
print(f"Write result: {'OK' if ok else 'FAILED'}")
print(f"Data: {d.get('data', '')}")
print(f"Errors: {d.get('errors', '')}")

if ok:
    print()
    print("=" * 60)
    print("SUCCESS! Bootstrap server.js written to server.")
    print()
    print("NEXT: Please do the following in your browser:")
    print()
    print("1. Go to: https://bst2.cloudswebserver.com:2083")
    print("2. Click 'Setup Node.js App' (in Software section)")
    print("3. Find the ai.cliqter.com application")
    print("4. Click the 'Restart' button")
    print()
    print("The bootstrap will:")
    print("  - Start listening on the assigned port")
    print("  - Extract cpanel-standalone.zip automatically")
    print("  - Load the real standalone server from .next/standalone/server.js")
    print()
    print("After restart, check https://ai.cliqter.com - it should work!")
    print("=" * 60)
else:
    print("FAILED to write server.js")
