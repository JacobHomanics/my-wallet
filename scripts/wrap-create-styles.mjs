#!/usr/bin/env node
/** Wrap createStyles return values in StyleSheet.create for proper RN typing. */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');

const files = execSync(
  `rg -l "function createStyles" src --glob "*.tsx" --glob "*.ts"`,
  { cwd: ROOT, encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .filter(Boolean);

for (const relativePath of files) {
  const fullPath = path.join(ROOT, relativePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  if (content.includes('return StyleSheet.create({')) {
    continue;
  }

  const updated = content.replace(
    /function createStyles\(c: ThemeColors\) \{\n  return \{/,
    'function createStyles(c: ThemeColors) {\n  return StyleSheet.create({',
  );

  if (updated === content) {
    continue;
  }

  let next = updated.replace(/\};\n\}\n/g, '});\n}\n');

  if (!next.includes("StyleSheet") && next.includes('StyleSheet.create')) {
    next = next.replace(
      /from 'react-native';/,
      (match, offset, str) => {
        const lineStart = str.lastIndexOf('import {', offset);
        const block = str.slice(lineStart, offset + match.length);
        if (block.includes('StyleSheet')) return match;
        return match.replace(
          "from 'react-native'",
          ", StyleSheet } from 'react-native'",
        ).replace('import {,', 'import {');
      },
    );
    // simpler: add StyleSheet to existing import
    if (!next.match(/import \{[^}]*StyleSheet/)) {
      next = next.replace(
        /import \{([^}]+)\} from 'react-native';/,
        (m, imports) => {
          if (imports.includes('StyleSheet')) return m;
          return `import {${imports.trim()}, StyleSheet } from 'react-native';`;
        },
      );
    }
  }

  fs.writeFileSync(fullPath, next);
  console.log('wrapped', relativePath);
}
