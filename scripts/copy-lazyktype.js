const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'native-patches', 'LazyKType.kt');

if (!fs.existsSync(sourcePath)) {
  console.error(`[LazyKType Patch] Source file not found: ${sourcePath}`);
  process.exit(0);
}

// 1. Copy to node_modules/expo-modules-core
const destNodeModulesDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'android',
  'src',
  'main',
  'class',
  'expo',
  'modules',
  'kotlin',
  'types'
);

// Wait, the path might be java instead of class in some versions, let's support both
const destNodeModulesJavaDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'kotlin',
  'types'
);

function copyFile(src, destDir) {
  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destFile = path.join(destDir, 'LazyKType.kt');
    fs.copyFileSync(src, destFile);
    console.log(`[LazyKType Patch] Successfully copied to: ${destFile}`);
  } catch (err) {
    console.warn(`[LazyKType Patch] Could not copy to ${destDir}:`, err.message);
  }
}

// Copy to node_modules (both java and class subfolders to be safe)
copyFile(sourcePath, destNodeModulesJavaDir);
copyFile(sourcePath, destNodeModulesDir);

// 2. Copy to generated android/app folder if it exists
const destAndroidAppDir = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'kotlin',
  'types'
);

if (fs.existsSync(path.join(__dirname, '..', 'android'))) {
  copyFile(sourcePath, destAndroidAppDir);
} else {
  console.log('[LazyKType Patch] Native android folder does not exist yet. Patch will apply on prebuild.');
}
