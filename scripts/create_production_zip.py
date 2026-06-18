import os
import zipfile

def create_production_zip():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    zip_filename = os.path.join(project_root, "cpanel-production.zip")
    
    print(f"Creating production zip: {zip_filename}")
    
    # Exclude these entire directories
    exclude_dirs = {
        '.git',
        'node_modules',       # cPanel "Run NPM Install" button handles this
        '__pycache__',
        'extractor-service',  # separate service, skip for now
        'doc',
        'tests',
    }
    
    # Exclude specific files
    exclude_files = {
        'dev.db',
        'dev.db-journal',
        'tsconfig.tsbuildinfo',
        'ai-detection-dashboard.zip',
        'cpanel-deploy.zip',
        'cpanel-production.zip',
        'deploy.zip',
        'mastermind.md',
        '.DS_Store',
        'test-document.txt',
    }
    
    # Also exclude local .env (we will set env vars directly on cPanel)
    exclude_files.add('.env')

    file_count = 0
    total_size = 0

    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(project_root):
            rel_root = os.path.relpath(root, project_root)
            
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if (file in exclude_files or 
                    file.endswith('.pyc') or 
                    file.startswith('.~') or 
                    file == '.DS_Store'):
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, project_root)
                
                zip_file.write(full_path, rel_path)
                file_size = os.path.getsize(full_path)
                total_size += file_size
                file_count += 1
                
                # Show .next files being included
                if rel_path.startswith('.next'):
                    print(f"  [.next] {rel_path}")
    
    zip_size = os.path.getsize(zip_filename)
    print(f"\nArchive created successfully!")
    print(f"  Total files included: {file_count}")
    print(f"  Source size: {total_size / 1024 / 1024:.1f} MB")
    print(f"  ZIP size: {zip_size / 1024 / 1024:.1f} MB")
    print(f"  Output: {zip_filename}")
    print()
    print("This ZIP contains:")
    print("  [OK] Source code (src/)")
    print("  [OK] Pre-built .next/ production build")
    print("  [OK] Prisma schema (prisma/)")
    print("  [OK] Configuration files (package.json, next.config.ts, etc.)")
    print("  [OK] server.js (custom HTTP server)")
    print("  [SKIP] node_modules/ - use 'Run NPM Install' in cPanel Node.js App")
    print("  [SKIP] .env - set environment variables directly in cPanel Node.js App")

if __name__ == "__main__":
    create_production_zip()
