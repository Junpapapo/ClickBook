import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const manifestJsonPath = path.join(rootDir, 'manifest.json');

try {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version || '1.0.0';
  
  // Bump version
  const parts = currentVersion.split('.');
  if (parts.length >= 3) {
    parts[2] = String(parseInt(parts[2], 10) + 1);
  } else {
    parts.push('1');
  }
  const newVersion = parts.join('.');

  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  console.log(`[package.json] Version bumped: ${currentVersion} -> ${newVersion}`);

  // Read and update manifest.json if it exists
  if (fs.existsSync(manifestJsonPath)) {
    const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
    manifestJson.version = newVersion;
    fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n', 'utf8');
    console.log(`[manifest.json] Version bumped: ${currentVersion} -> ${newVersion}`);
  }
} catch (error) {
  console.error('Failed to bump version:', error.message);
  process.exit(1);
}
