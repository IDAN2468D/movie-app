import os
import shutil
import subprocess

# Stop Gradle Daemons first
try:
    print("Stopping Gradle Daemon...")
    subprocess.run("cmd /c gradlew --stop", shell=True, cwd=r"c:\Users\kazam\Desktop\App\project-movie\movie-app\android")
except Exception as e:
    print(f"Error stopping Gradle: {e}")

paths_to_delete = [
    r"c:\Users\kazam\Desktop\App\project-movie\movie-app\android\build",
    r"c:\Users\kazam\Desktop\App\project-movie\movie-app\android\app\build",
    r"c:\Users\kazam\Desktop\App\project-movie\movie-app\android\app\.cxx",
    r"c:\Users\kazam\Desktop\App\project-movie\movie-app\node_modules\react-native-reanimated\android\build",
    r"c:\Users\kazam\Desktop\App\project-movie\movie-app\node_modules\react-native-reanimated\android\.cxx",
    r"c:\Users\kazam\Desktop\App\project-movie\movie-app\node_modules\react-native-worklets\android\build",
    r"c:\Users\kazam\Desktop\App\project-movie\movie-app\node_modules\react-native-worklets\android\.cxx",
    r"c:\Users\kazam\Desktop\App\project-movie\movie-app\node_modules\expo-modules-core\android\build",
    r"c:\Users\kazam\Desktop\App\project-movie\movie-app\node_modules\expo-modules-core\android\.cxx"
]

for path in paths_to_delete:
    if os.path.exists(path):
        print(f"Deleting: {path}")
        try:
            if os.path.isdir(path):
                shutil.rmtree(path)
            else:
                os.remove(path)
            print("Successfully deleted")
        except Exception as e:
            print(f"Failed to delete {path}: {e}")
