#!/usr/bin/env node
/**
 * Packages the Expo web export as an unpacked Chrome extension (MV3 popup).
 *
 * Usage:
 *   pnpm build:extension
 *   pnpm build:extension -- --skip-web-build   # reuse existing dist/
 *
 * Load in Chrome:
 *   1. pnpm build:extension
 *   2. chrome://extensions → Developer mode → Load unpacked → select extension/dist/
 *   3. Copy the extension ID and add chrome-extension://<id> to Privy allowed origins
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const webDist = join(root, 'dist');
const extensionSrc = join(root, 'extension');
const extensionDist = join(extensionSrc, 'dist');

const skipWebBuild = process.argv.includes('--skip-web-build');

function runWebBuild() {
  const result = spawnSync('pnpm', ['build:web'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

/** MV3 extension pages disallow inline scripts — strip PWA/service-worker boot code. */
function patchIndexHtml(html) {
  let patched = html
    .replace(/<link rel="manifest" href="\/manifest\.json" \/>\s*/g, '')
    .replace(
      /<script>\s*\(function \(\) \{[\s\S]*?serviceWorker[\s\S]*?\}\)\(\);\s*<\/script>\s*/g,
      '',
    );

  if (!patched.includes('popup.css')) {
    patched = patched.replace(
      '</head>',
      '    <link rel="stylesheet" href="/popup.css" />\n  </head>',
    );
  }

  return patched;
}

/** Chrome rejects any extension file or directory whose name starts with "_". */
function sanitizeBasename(name) {
  if (!name.startsWith('_')) {
    return name;
  }

  const sanitized = name.replace(/^_+/, '');
  return sanitized.length > 0 ? sanitized : 'resource';
}

/** Rename reserved paths depth-first, then fix bundled URL references. */
function sanitizeReservedPaths(rootDir) {
  function walk(currentDir) {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(join(currentDir, entry.name));
      }
    }

    for (const entry of entries) {
      if (!entry.name.startsWith('_')) {
        continue;
      }

      const oldPath = join(currentDir, entry.name);
      const newPath = join(currentDir, sanitizeBasename(entry.name));
      renameSync(oldPath, newPath);
    }
  }

  walk(rootDir);

  const urlRewrites = [
    ['/_expo/', '/expo/'],
    ['/__expo-metro-runtime-', '/expo-metro-runtime-'],
    ['/__common-', '/common-'],
  ];

  function rewriteTextFile(filePath) {
    const original = readFileSync(filePath, 'utf8');
    let next = original;

    for (const [from, to] of urlRewrites) {
      next = next.split(from).join(to);
    }

    if (next !== original) {
      writeFileSync(filePath, next);
    }
  }

  function rewriteTree(currentDir) {
    for (const entry of readdirSync(currentDir)) {
      const fullPath = join(currentDir, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        rewriteTree(fullPath);
        continue;
      }

      if (/\.(?:html?|js|json)$/i.test(entry)) {
        rewriteTextFile(fullPath);
      }
    }
  }

  rewriteTree(rootDir);
}

function copyExtensionShell() {
  cpSync(join(extensionSrc, 'manifest.json'), join(extensionDist, 'manifest.json'));
  cpSync(join(extensionSrc, 'popup.css'), join(extensionDist, 'popup.css'));
}

function main() {
  if (!skipWebBuild) {
    console.log('Building web export (expo export)…');
    runWebBuild();
  } else if (!existsSync(webDist)) {
    console.error('Missing dist/. Run pnpm build:web first or drop --skip-web-build.');
    process.exit(1);
  }

  if (!existsSync(webDist)) {
    console.error('Web build did not produce dist/.');
    process.exit(1);
  }

  console.log('Packaging extension/dist/…');
  rmSync(extensionDist, { recursive: true, force: true });
  mkdirSync(extensionDist, { recursive: true });
  cpSync(webDist, extensionDist, { recursive: true });
  sanitizeReservedPaths(extensionDist);

  const indexPath = join(extensionDist, 'index.html');
  const indexHtml = readFileSync(indexPath, 'utf8');
  writeFileSync(indexPath, patchIndexHtml(indexHtml));

  copyExtensionShell();

  console.log('');
  console.log('Extension ready:', extensionDist);
  console.log('');
  console.log('Load unpacked in chrome://extensions, then whitelist in Privy:');
  console.log('  chrome-extension://<your-extension-id>');
  console.log('');
}

main();
