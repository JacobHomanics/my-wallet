#!/usr/bin/env node
/** Fix files where sub-components reference styles/colors without hooks. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const FILES = [
  'src/components/ContactPickerContent.tsx',
  'src/components/OnrampOptionPickerModal.tsx',
  'src/components/SendAdvancedDetails.tsx',
  'src/components/SendSearchContent.tsx',
  'src/components/TokenChainSection.tsx',
  'src/components/TokenIcon.tsx',
  'src/screens/ContactDetailsScreen.tsx',
  'src/screens/ContactsScreen.tsx',
  'src/screens/LoginScreen.tsx',
  'src/screens/SendAdvancedSearchScreen.tsx',
  'src/screens/SentScreen.tsx',
  'src/screens/StripeOnrampScreen.web.tsx',
];

function fixFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  if (content.includes('createThemedStylesContext')) {
    return false;
  }

  if (!content.includes('function createStyles')) {
    return false;
  }

  content = content.replace(
    "import { useThemedStyles } from '@/hooks/useThemedStyles';",
    "import { createThemedStylesContext } from '@/hooks/createThemedStylesContext';\nimport { useThemedStyles } from '@/hooks/useThemedStyles';",
  );

  content = content.replace(
    /\}\n\}\n\s*$/,
    '};\n}\n\nconst { Provider: ThemedStylesProvider, useStyles } =\n  createThemedStylesContext(createStyles);\n',
  );

  // Add useStyles to inner functions that reference styles. but not export function main
  content = content.replace(
    /(^|\n)(function [A-Z]\w+\([^)]*\) \{)\n(?![\s\S]*?useStyles\(\))/g,
    (match, prefix, fnStart) => {
      if (fnStart.includes('Provider')) return match;
      return `${prefix}${fnStart}\n  const { styles, colors } = useStyles();\n`;
    },
  );

  // Wrap main export return in provider
  content = content.replace(
    /(export function \w+[^{]+\{[\s\S]*?)(  return \()\n/s,
    (match, before, returnStart) => {
      if (before.includes('<ThemedStylesProvider>')) return match;
      return `${before}${returnStart}\n    <ThemedStylesProvider>`;
    },
  );

  // Close provider before final ); of export function - fragile, do manually for complex files

  fs.writeFileSync(fullPath, content);
  return true;
}

for (const file of FILES) {
  if (fixFile(file)) console.log('patched', file);
}
