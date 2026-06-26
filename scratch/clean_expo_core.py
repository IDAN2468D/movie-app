import os
import subprocess

paths = [
    r"c:\Users\kazam\Desktop\App\project-movie\movie-app\node_modules\expo-modules-core\android\build",
    r"c:\Users\kazam\Desktop\App\project-movie\movie-app\node_modules\expo-modules-core\android\.cxx"
]

for p in paths:
    if os.path.exists(p):
        print(f"Deleting: {p}")
        res = subprocess.run(f'rmdir /s /q "{p}"', shell=True)
        if res.returncode == 0:
            print("Successfully deleted")
        else:
            print(f"Failed to delete (code {res.returncode})")
