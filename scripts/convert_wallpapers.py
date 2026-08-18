import os
import glob
import json
from PIL import Image

def process_wallpapers():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    docs_dark = os.path.join(base_dir, "docs", "assets", "wallpapers", "dark")
    docs_light = os.path.join(base_dir, "docs", "assets", "wallpapers", "light")
    
    pub_dark = os.path.join(base_dir, "public", "wallpapers", "dark")
    pub_light = os.path.join(base_dir, "public", "wallpapers", "light")
    
    os.makedirs(pub_dark, exist_ok=True)
    os.makedirs(pub_light, exist_ok=True)
    
    manifest = {
        "dark": [],
        "light": []
    }
    
    # 1. Dark Wallpapers
    dark_files = sorted(glob.glob(os.path.join(docs_dark, "*.*")))
    print(f"Found {len(dark_files)} dark wallpapers in docs.")
    for idx, fpath in enumerate(dark_files, 1):
        if not fpath.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
        dest_filename = f"dark_{idx:02d}.webp"
        dest_path = os.path.join(pub_dark, dest_filename)
        
        try:
            with Image.open(fpath) as img:
                img = img.convert("RGB")
                img.save(dest_path, "WEBP", quality=85, method=6)
            size_kb = os.path.getsize(dest_path) / 1024
            print(f"Converted: {os.path.basename(fpath)} -> {dest_filename} ({size_kb:.1f} KB)")
            
            manifest["dark"].append({
                "id": f"dark_{idx:02d}",
                "filename": dest_filename,
                "nameKo": f"다크 월페이퍼 #{idx:02d}",
                "nameEn": f"Dark Wallpaper #{idx:02d}",
                "path": f"/wallpapers/dark/{dest_filename}",
                "theme": "dark"
            })
        except Exception as e:
            print(f"Error processing {fpath}: {e}")
            
    # 2. Light Wallpapers
    light_files = sorted(glob.glob(os.path.join(docs_light, "*.*")))
    print(f"Found {len(light_files)} light wallpapers in docs.")
    for idx, fpath in enumerate(light_files, 1):
        if not fpath.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
        dest_filename = f"light_{idx:02d}.webp"
        dest_path = os.path.join(pub_light, dest_filename)
        
        try:
            with Image.open(fpath) as img:
                img = img.convert("RGB")
                img.save(dest_path, "WEBP", quality=85, method=6)
            size_kb = os.path.getsize(dest_path) / 1024
            print(f"Converted: {os.path.basename(fpath)} -> {dest_filename} ({size_kb:.1f} KB)")
            
            manifest["light"].append({
                "id": f"light_{idx:02d}",
                "filename": dest_filename,
                "nameKo": f"라이트 월페이퍼 #{idx:02d}",
                "nameEn": f"Light Wallpaper #{idx:02d}",
                "path": f"/wallpapers/light/{dest_filename}",
                "theme": "light"
            })
        except Exception as e:
            print(f"Error processing {fpath}: {e}")
            
    # Save Manifest to public and src
    manifest_pub = os.path.join(base_dir, "public", "wallpapers", "wallpapers.json")
    with open(manifest_pub, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        
    manifest_src = os.path.join(base_dir, "src", "utils", "wallpaperManifest.json")
    with open(manifest_src, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        
    print(f"Manifest generated with {len(manifest['dark'])} dark & {len(manifest['light'])} light wallpapers.")

if __name__ == "__main__":
    process_wallpapers()
