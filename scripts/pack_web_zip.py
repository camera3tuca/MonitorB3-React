import os
import zipfile

dist_dir = 'dist'
output_zip = 'public/monitorb3-web.zip'
exclude_files = {'server.cjs', 'server.cjs.map', 'monitorb3-web.zip'}

if not os.path.exists(dist_dir):
    print("dist directory does not exist, run build first.")
    exit(0)

os.makedirs('public', exist_ok=True)

with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            if file in exclude_files or file.endswith('.zip'):
                continue
            full_path = os.path.join(root, file)
            arcname = os.path.relpath(full_path, dist_dir)
            zipf.write(full_path, arcname)

size_mb = os.path.getsize(output_zip) / (1024 * 1024)
print(f"Generated clean {output_zip} ({size_mb:.2f} MB)")

if os.path.exists('dist'):
    import shutil
    shutil.copy2(output_zip, 'dist/monitorb3-web.zip')
