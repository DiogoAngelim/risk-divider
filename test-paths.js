import { app } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getBasePath() {
  return app.isPackaged
    ? join(process.resourcesPath, 'dist')
    : join(__dirname, 'app');
}

function getBinaryPath() {
  return app.isPackaged
    ? process.resourcesPath
    : join(__dirname, 'app');
}

console.log('=== PATH TESTING ===');
console.log('app.isPackaged:', app.isPackaged);
console.log('process.resourcesPath:', process.resourcesPath);
console.log('__dirname:', __dirname);
console.log('');
console.log('getBasePath():', getBasePath());
console.log('getBinaryPath():', getBinaryPath());
console.log('');
console.log('Expected HTML path:', join(getBasePath(), 'index.html'));
console.log('Expected binary path:', join(getBinaryPath(), 'bin', 'ai'));