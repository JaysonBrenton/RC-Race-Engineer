/**
 * RC Race Engineer
 * File: scripts/add-headers.mjs
 * Author: Jayson + The Brainy One
 * Created: 2025-09-16
 * Purpose: Insert standard headers into source files that lack them.
 * License: MIT
 */
import fs from 'fs';
import path from 'path';
const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
const today = new Date().toISOString().slice(0, 10);
const makeHeader = (filename) => `/**
 * RC Race Engineer
 * File: ${filename}
 * Author: Jayson + The Brainy One
 * Created: ${today}
 * Purpose: TBD
 * License: MIT
 */\n`;
function walk(dir, root = dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.env') continue;
    if (['node_modules', 'dist', 'build', '.next', '.git', '.husky'].includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, root);
    else {
      const ext = path.extname(p); if (!exts.has(ext)) continue;
      const rel = path.relative(root, p);
      const text = fs.readFileSync(p, 'utf8');
      if (text.trimStart().startsWith('/** RC Race Engineer')) continue;
      fs.writeFileSync(p, makeHeader(rel) + text, 'utf8');
    }
  }
}
walk(process.cwd());
