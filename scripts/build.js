import { cpSync, mkdirSync, rmSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const DIST = 'dist';

// Clean
if (existsSync(DIST)) rmSync(DIST, { recursive: true });
mkdirSync(DIST, { recursive: true });
mkdirSync(`${DIST}/utils`, { recursive: true });
mkdirSync(`${DIST}/icons`, { recursive: true });

// Copy source files
cpSync('src/popup.html', `${DIST}/popup.html`);
cpSync('src/popup.js', `${DIST}/popup.js`);
cpSync('src/background.js', `${DIST}/background.js`);
cpSync('src/content.js', `${DIST}/content.js`);
cpSync('src/utils/claude-api.js', `${DIST}/utils/claude-api.js`);
cpSync('src/utils/storage.js', `${DIST}/utils/storage.js`);
cpSync('src/utils/marketplace.js', `${DIST}/utils/marketplace.js`);
cpSync('manifest.json', `${DIST}/manifest.json`);

// Copy icons if they exist
if (existsSync('icons')) {
  cpSync('icons', `${DIST}/icons`, { recursive: true });
}

// Build Tailwind CSS
console.log('Building Tailwind CSS...');
execSync('npx tailwindcss -i src/popup.css -o dist/popup.css --minify', { stdio: 'inherit' });

console.log('Build complete → dist/');
