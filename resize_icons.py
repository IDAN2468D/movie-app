import os
import math
from PIL import Image
from collections import deque

def process_adaptive_icon():
    print("Processing adaptive-icon.png...")
    img = Image.open('assets/images/adaptive-icon-original.png')
    w, h = img.size
    pixels = img.load()
    
    # 1. Run BFS from borders to find background pixels
    visited = set()
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h-1)); visited.add((x, 0)); visited.add((x, h-1))
    for y in range(h):
        q.append((0, y)); q.append((w-1, y)); visited.add((0, y)); visited.add((w-1, y))
        
    bg_pixels = set()
    while q:
        x, y = q.popleft()
        r, g, b = pixels[x, y]
        # Background is dark grey (around (31,31,31))
        if r < 45 and g < 45 and b < 45:
            bg_pixels.add((x, y))
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    q.append((nx, ny))
                    
    # 2. Create RGBA image with transparent background
    rgba_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    rgba_pixels = rgba_img.load()
    for y in range(h):
        for x in range(w):
            if (x, y) not in bg_pixels:
                r, g, b = pixels[x, y]
                rgba_pixels[x, y] = (r, g, b, 255)
                
    # 3. Find bounding box of logo
    bbox = rgba_img.getbbox()
    print("Logo bounding box in adaptive-icon:", bbox)
    if bbox:
        logo = rgba_img.crop(bbox)
        # 4. Resize logo so that max dimension is 280 pixels (perfectly balanced and sits beautifully!)
        max_dim = max(logo.width, logo.height)
        scale = 450.0 / max_dim
        new_w = int(logo.width * scale)
        new_h = int(logo.height * scale)
        logo_resized = logo.resize((new_w, new_h), Image.LANCZOS)
        
        # 5. Paste centered on transparent 1024x1024 canvas
        canvas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
        offset_x = (1024 - new_w) // 2
        offset_y = (1024 - new_h) // 2
        canvas.paste(logo_resized, (offset_x, offset_y), logo_resized)
        
        canvas.save('assets/images/adaptive-icon.png')
        print("Successfully saved processed adaptive-icon.png!")
    else:
        print("Error: Could not find logo in adaptive-icon")

def process_solid_icon():
    print("Processing icon.png...")
    img = Image.open('assets/images/icon-original.png')
    w, h = img.size
    pixels = img.load()
    
    bg = (5, 9, 18)
    
    # 1. Create transparent copy of logo based on threshold
    rgba_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    rgba_pixels = rgba_img.load()
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            dist = math.sqrt((r-bg[0])**2 + (g-bg[1])**2 + (b-bg[2])**2)
            if dist >= 45:
                rgba_pixels[x, y] = (r, g, b, 255)
                
    # 2. Find bounding box of logo
    bbox = rgba_img.getbbox()
    print("Logo bounding box in icon.png:", bbox)
    if bbox:
        logo = rgba_img.crop(bbox)
        # 3. Resize logo so that max dimension is 450 pixels (perfectly proportioned with elegant margins!)
        max_dim = max(logo.width, logo.height)
        scale = 450.0 / max_dim
        new_w = int(logo.width * scale)
        new_h = int(logo.height * scale)
        logo_resized = logo.resize((new_w, new_h), Image.LANCZOS)
        
        # 4. Paste centered on solid deep-blue (5, 9, 18) 1024x1024 canvas
        canvas = Image.new('RGBA', (1024, 1024), (5, 9, 18, 255))
        offset_x = (1024 - new_w) // 2
        offset_y = (1024 - new_h) // 2
        canvas.paste(logo_resized, (offset_x, offset_y), logo_resized)
        
        canvas.save('assets/images/icon.png')
        print("Successfully saved processed icon.png!")
    else:
        print("Error: Could not find logo in icon.png")

if __name__ == '__main__':
    process_adaptive_icon()
    process_solid_icon()
    print("All icons processed beautifully!")
