import os
import zipfile

def create_project_zip():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    zip_filename = os.path.join(project_root, "ai-detection-dashboard.zip")
    
    print(f"Creating project zip archive: {zip_filename}")
    
    # Exclude directories
    exclude_dirs = {
        '.git',
        '.next',
        'node_modules',
        'dist',
        '__pycache__',
        '.pytest_cache',
        '.ipynb_checkpoints',
    }
    
    # Exclude specific files
    exclude_files = {
      'dev.db',
      'dev.db-journal',
      'tsconfig.tsbuildinfo',
      'ai-detection-dashboard.zip',
      'mastermind.md',
    }
    
    file_count = 0
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(project_root):
            # Modify dirs in-place to prevent os.walk from visiting excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                # Exclude specific files and temporary editor/OS files
                if file in exclude_files or file.endswith('.pyc') or file.startswith('.~') or file == '.DS_Store':
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, project_root)
                
                # Write file to zip
                zip_file.write(full_path, rel_path)
                file_count += 1
                
    print(f"Archive created successfully! Total files zipped: {file_count}")

if __name__ == "__main__":
    create_project_zip()
