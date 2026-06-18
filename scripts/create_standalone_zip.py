"""
Creates a slim standalone deployment ZIP for cPanel.

In Next.js standalone mode, .next/standalone/ contains a self-contained
Node.js server with minimal bundled node_modules (~20-50MB vs 600MB+).
We package:
  - .next/standalone/        (the standalone server + bundled deps)
  - .next/static/            (static assets like CSS/JS chunks)
  - public/                  (public assets)
  - prisma/                  (schema + seed for db push)
  - server.js                (entry point that calls standalone server)
  - package.json             (needed for cPanel Node.js App)
  
We DO NOT package:
  - node_modules/  (standalone has its own minimal copy inside .next/standalone/)
  - .next/cache/   (build cache, not needed)
  - .next/server/  (server chunks - already inside standalone)
  - .git/
"""
import os
import zipfile

def create_standalone_zip():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    zip_filename = os.path.join(project_root, "cpanel-standalone.zip")
    
    # Check .next/standalone exists
    standalone_dir = os.path.join(project_root, ".next", "standalone")
    if not os.path.isdir(standalone_dir):
        print("ERROR: .next/standalone not found. Run 'npm run build' first with output: 'standalone' in next.config.ts")
        return

    print(f"Creating standalone deployment zip: {zip_filename}")
    
    file_count = 0
    total_size = 0

    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        
        def add_dir(src_dir, arc_prefix):
            """Recursively add a directory to the zip."""
            nonlocal file_count, total_size
            for root, dirs, files in os.walk(src_dir):
                # Skip __pycache__ and .DS_Store
                dirs[:] = [d for d in dirs if d not in ('__pycache__', '.pytest_cache')]
                for fname in files:
                    if fname == '.DS_Store':
                        continue
                    full = os.path.join(root, fname)
                    rel = os.path.relpath(full, src_dir)
                    arc_name = os.path.join(arc_prefix, rel).replace("\\", "/")
                    zf.write(full, arc_name)
                    sz = os.path.getsize(full)
                    total_size += sz
                    file_count += 1

        def add_file(src_file, arc_name):
            nonlocal file_count, total_size
            if os.path.isfile(src_file):
                zf.write(src_file, arc_name)
                total_size += os.path.getsize(src_file)
                file_count += 1
                print(f"  [file] {arc_name}")

        # 1. .next/standalone/ -> standalone/
        print("Adding .next/standalone/ ...")
        add_dir(standalone_dir, "standalone")
        
        # 2. .next/static/ -> standalone/.next/static/
        static_dir = os.path.join(project_root, ".next", "static")
        if os.path.isdir(static_dir):
            print("Adding .next/static/ ...")
            add_dir(static_dir, "standalone/.next/static")
        
        # 3. public/ -> standalone/public/
        public_dir = os.path.join(project_root, "public")
        if os.path.isdir(public_dir):
            print("Adding public/ ...")
            add_dir(public_dir, "standalone/public")

        # 4. prisma/ (schema + seed, but NOT the .db files)
        prisma_dir = os.path.join(project_root, "prisma")
        if os.path.isdir(prisma_dir):
            print("Adding prisma/ ...")
            for fname in os.listdir(prisma_dir):
                if fname.endswith('.db') or fname.endswith('.db-journal'):
                    continue
                full = os.path.join(prisma_dir, fname)
                if os.path.isfile(full):
                    add_file(full, f"prisma/{fname}")

        # 5. Root files needed by cPanel
        add_file(os.path.join(project_root, "server.js"), "server.js")
        add_file(os.path.join(project_root, "package.json"), "package.json")
        add_file(os.path.join(project_root, "package-lock.json"), "package-lock.json")
        add_file(os.path.join(project_root, ".env.example"), ".env.example")

    zip_size = os.path.getsize(zip_filename)
    print(f"\nDone!")
    print(f"  Files: {file_count}")
    print(f"  Source size: {total_size / 1024 / 1024:.1f} MB")
    print(f"  ZIP size: {zip_size / 1024 / 1024:.1f} MB")
    print(f"  Output: {zip_filename}")
    print()
    print("NEXT STEPS ON CPANEL:")
    print("1. Upload cpanel-standalone.zip to /home/cliqterc/ai.cliqter.com")
    print("2. Extract it (overwrite existing files)")
    print("3. Set env vars in Node.js App settings")
    print("4. Run NPM Install (for prisma CLI only)")
    print("5. In Node.js App terminal or NPM Script: npx prisma db push && npx prisma db seed")
    print("6. Start the app - startup file: server.js")


if __name__ == "__main__":
    create_standalone_zip()
