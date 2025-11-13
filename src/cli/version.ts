import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let version = '1.0.0'; // fallback

try {
  const pkgPath = path.resolve(__dirname, '../../package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  version = pkgJson.version || version;
} catch {
}

export { version };
