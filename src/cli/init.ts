import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// __dirname workaround for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function init() {
  const initPath = path.resolve(__dirname, '../init.js');

  try {
    execSync(`node "${initPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Failed to run init:', err);
    process.exit(1);
  }
}