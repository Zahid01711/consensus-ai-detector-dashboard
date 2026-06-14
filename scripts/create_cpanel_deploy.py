import os
import zipfile

def create_cpanel_deploy_zip():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    zip_filename = os.path.join(project_root, "cpanel-deploy.zip")
    
    print(f"Creating cPanel deployment zip: {zip_filename}")
    
    # Exclude these entire directories from the zip
    exclude_dirs = {
        '.git',
        'node_modules',       # cPanel will run npm install
        '.next',              # cPanel will run npm run build
        '__pycache__',
        '.pytest_cache',
        '.ipynb_checkpoints',
        'doc',                # documentation, not needed for hosting
        'tests',              # test files, not needed
        'extractor-service',  # separate service, skip for now
    }
    
    # Exclude specific files
    exclude_files = {
        'dev.db',
        'dev.db-journal',
        'tsconfig.tsbuildinfo',
        'ai-detection-dashboard.zip',
        'cpanel-deploy.zip',
        'deploy.zip',
        'mastermind.md',
        '.DS_Store',
    }
    
    # No force-include dirs needed - .next will be built on server
    force_include_dirs = set()
    
    file_count = 0
    total_size = 0

    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(project_root):
            # Get relative path to determine if we're in a force-included dir
            rel_root = os.path.relpath(root, project_root)
            
            # Check if we're inside a force-included directory
            in_force_include = any(
                rel_root == d or rel_root.startswith(d + os.sep)
                for d in force_include_dirs
            )
            
            if not in_force_include:
                # Modify dirs in-place to prevent os.walk from visiting excluded directories
                dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                # Exclude specific files and temporary editor/OS files
                if (file in exclude_files or 
                    file.endswith('.pyc') or 
                    file.startswith('.~') or 
                    file == '.DS_Store'):
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, project_root)
                
                # Write file to zip
                zip_file.write(full_path, rel_path)
                file_size = os.path.getsize(full_path)
                total_size += file_size
                file_count += 1
    
    zip_size = os.path.getsize(zip_filename)
    print(f"Archive created successfully!")
    print(f"  Total files included: {file_count}")
    print(f"  Source size: {total_size / 1024 / 1024:.1f} MB")
    print(f"  ZIP size: {zip_size / 1024 / 1024:.1f} MB")
    print(f"  Output: {zip_filename}")
    print()
    print("This ZIP contains:")
    print("  [OK] Source code (src/)")
    print("  [OK] Prisma schema (prisma/)")
    print("  [OK] Configuration files (package.json, next.config.ts, etc.)")
    print("  [OK] server.js (custom HTTP server)")
    print("  [SKIP] .next/ - cPanel will run: npm run build")
    print("  [SKIP] node_modules/ - cPanel will run: npm install")
    print("  [SKIP] dev.db - fresh database will be seeded on server")
    print("  [SKIP] .git - version control not needed on host")

if __name__ == "__main__":
    create_cpanel_deploy_zip()
