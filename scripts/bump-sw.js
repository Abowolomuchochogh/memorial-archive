// Automatically bump the service worker cache version before each build.
// This ensures every deploy triggers the "New update available" banner.

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swPath = join(__dirname, '..', 'public', 'sw.js');
const timestamp = Math.floor(Date.now() / 1000);
const newCacheName = `kamgbunli-${timestamp}`;

let content = readFileSync(swPath, 'utf8');
content = content.replace(
    /const CACHE_NAME = '[^']+';/,
    `const CACHE_NAME = '${newCacheName}';`
);
writeFileSync(swPath, content, 'utf8');

console.log(`✅ SW cache bumped to: ${newCacheName}`);
