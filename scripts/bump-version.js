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
  
  // Bump version (10단위 올림 처리되는 시맨틱 버저닝 롤링 규칙 적용)
  let [major, minor, patch] = currentVersion.split('.').map(num => parseInt(num, 10));
  if (isNaN(major)) major = 1;
  if (isNaN(minor)) minor = 0;
  if (isNaN(patch)) patch = 0;

  patch += 1;
  if (patch >= 10) {
    patch = 0;
    minor += 1;
  }
  if (minor >= 10) {
    minor = 0;
    major += 1;
  }
  const newVersion = `${major}.${minor}.${patch}`;

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
