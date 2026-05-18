import os
from PIL import Image, ImageDraw

res_dir = r"C:\Users\Lenovo\Desktop\project-movie\movie-app\android\app\src\main\res"

adaptive_src_path = r"c:\Users\Lenovo\Desktop\project-movie\movie-app\assets\images\adaptive-icon.png"
icon_src_path = r"c:\Users\Lenovo\Desktop\project-movie\movie-app\assets\images\icon.png"

configs = {
    "mipmap-mdpi": {
        "launcher": 48,
        "foreground": 108
    },
    "mipmap-hdpi": {
        "launcher": 72,
        "foreground": 162
    },
    "mipmap-xhdpi": {
        "launcher": 96,
        "foreground": 216
    },
    "mipmap-xxhdpi": {
        "launcher": 144,
        "foreground": 324
    },
    "mipmap-xxxhdpi": {
        "launcher": 192,
        "foreground": 432
    }
}

def mask_circle(img):
    mask = Image.new('L', img.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, img.size[0], img.size[1]), fill=255)
    result = img.copy()
    result.putalpha(mask)
    return result

def update_icons():
    print("Opening high-resolution source images...")
    with Image.open(adaptive_src_path) as adaptive_src, Image.open(icon_src_path) as icon_src:
        for folder, sizes in configs.items():
            folder_path = os.path.join(res_dir, folder)
            if not os.path.exists(folder_path):
                print(f"Warning: folder {folder_path} does not exist. Skipping.")
                continue
                
            print(f"\nProcessing icons for {folder}...")
            
            # 1. Update ic_launcher_foreground.webp (from adaptive_src)
            fore_size = sizes["foreground"]
            fore_img = adaptive_src.resize((fore_size, fore_size), Image.LANCZOS)
            fore_dest = os.path.join(folder_path, "ic_launcher_foreground.webp")
            fore_img.save(fore_dest, format="PNG")
            print(f"  Saved ic_launcher_foreground.webp ({fore_size}x{fore_size})")
            
            # 2. Update ic_launcher.webp (from icon_src)
            launch_size = sizes["launcher"]
            launch_img = icon_src.resize((launch_size, launch_size), Image.LANCZOS)
            launch_dest = os.path.join(folder_path, "ic_launcher.webp")
            launch_img.save(launch_dest, format="PNG")
            print(f"  Saved ic_launcher.webp ({launch_size}x{launch_size})")
            
            # 3. Update ic_launcher_round.webp (from icon_src, circular masked)
            round_img = mask_circle(launch_img)
            round_dest = os.path.join(folder_path, "ic_launcher_round.webp")
            round_img.save(round_dest, format="PNG")
            print(f"  Saved ic_launcher_round.webp ({launch_size}x{launch_size})")

if __name__ == '__main__':
    update_icons()
    print("\nAll native Android launcher assets successfully updated with high-precision downsampling!")
