#!/usr/bin/env node
/**
 * Codemod: migrate hardcoded pesto palette hex values to themed styles.
 * Run: node scripts/migrate-theme-colors.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');

const STYLE_REPLACEMENTS = [
  ["backgroundColor: '#f0fdf4'", 'backgroundColor: c.bg'],
  ["backgroundColor: '#ecfdf5'", 'backgroundColor: c.surfaceHighlight'],
  ["backgroundColor: '#f7fee7'", 'backgroundColor: c.surfaceMuted'],
  ["backgroundColor: '#dcfce7'", 'backgroundColor: c.surfaceMuted'],
  ["backgroundColor: '#ffffff'", 'backgroundColor: c.surface'],
  ["backgroundColor: '#fff'", 'backgroundColor: c.surface'],
  ["backgroundColor: '#166534'", 'backgroundColor: c.primary'],
  ["backgroundColor: '#15803d'", 'backgroundColor: c.success'],
  ["color: '#f0fdf4'", 'color: c.primaryText'],
  ["color: '#166534'", 'color: c.primary'],
  ["color: '#14532d'", 'color: c.text'],
  ["color: '#3f6b52'", 'color: c.textSecondary'],
  ["color: '#365c45'", 'color: c.textSecondary'],
  ["color: '#3f5f4c'", 'color: c.textSecondary'],
  ["color: '#5a7d6a'", 'color: c.textMuted'],
  ["color: '#86a894'", 'color: c.textSubtle'],
  ["color: '#15803d'", 'color: c.success'],
  ["color: '#b91c1c'", 'color: c.danger'],
  ["color: '#dc2626'", 'color: c.danger'],
  ["borderColor: '#d1fae5'", 'borderColor: c.rowBorder'],
  ["borderColor: '#bbf7d0'", 'borderColor: c.border'],
  ["borderColor: '#86efac'", 'borderColor: c.borderStrong'],
  ["borderColor: '#86d4a4'", 'borderColor: c.inputBorder'],
  ["borderColor: '#b7e4c7'", 'borderColor: c.border'],
  ["borderColor: '#166534'", 'borderColor: c.primary'],
  ["borderColor: '#fca5a5'", 'borderColor: c.dangerBorder'],
  ["borderBottomColor: '#d1fae5'", 'borderBottomColor: c.rowBorder'],
  ["borderTopColor: '#d1fae5'", 'borderTopColor: c.rowBorder'],
  ["placeholderTextColor: '#86a894'", 'placeholderTextColor: c.textSubtle'],
  ["tintColor: '#166534'", 'tintColor: c.primary'],
];

const INLINE_REPLACEMENTS = [
  [/color="#166534"/g, 'color={colors.primary}'],
  [/color="#f0fdf4"/g, 'color={colors.primaryText}'],
  [/color="#5a7d6a"/g, 'color={colors.textMuted}'],
  [/color="#86a894"/g, 'color={colors.textSubtle}'],
  [/color="#15803d"/g, 'color={colors.success}'],
  [/color="#b91c1c"/g, 'color={colors.danger}'],
  [/color="#14532d"/g, 'color={colors.text}'],
  [/color={isCopied\(copyKey\) \? '#15803d' : '#166534'}/g, 'color={isCopied(copyKey) ? colors.success : colors.primary}'],
  [/<ActivityIndicator color="#166534"/g, '<ActivityIndicator color={colors.primary}'],
  [/<ActivityIndicator color="#f0fdf4"/g, '<ActivityIndicator color={colors.primaryText}'],
  [/thumbColor={doNotShowAgain \? '#166534' : '#f0fdf4'}/g, 'thumbColor={doNotShowAgain ? colors.primary : colors.bg}'],
];

const SKIP = new Set([
  'src/theme/themes.ts',
  'src/theme/types.ts',
  'src/theme/colors.ts',
  'src/components/ColorThemePickerModal.tsx',
  'src/hooks/useColorTheme.ts',
  'src/hooks/useThemeColors.ts',
  'src/hooks/useThemedStyles.ts',
  'src/components/WalletDebitCard.tsx',
  'src/components/StripeIcon.tsx',
  'src/components/FarcasterIcon.tsx',
  'src/components/ZitiIcon.tsx',
]);

function listFiles() {
  return execSync(
    `rg -l "#166534|#f0fdf4|#d1fae5|#86a894|#5a7d6a" src --glob "*.tsx" --glob "*.ts"`,
    { cwd: ROOT, encoding: 'utf8' },
  )
    .trim()
    .split('\n')
    .filter(Boolean);
}

function applyReplacements(text, replacements) {
  let next = text;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  return next;
}

function addImport(content, importLine) {
  if (content.includes(importLine)) {
    return content;
  }
  const lastImport = content.lastIndexOf('\nimport ');
  if (lastImport === -1) {
    return `${importLine}\n${content}`;
  }
  const end = content.indexOf('\n', lastImport + 1);
  return `${content.slice(0, end + 1)}${importLine}\n${content.slice(end + 1)}`;
}

function removeStyleSheetImport(content) {
  return content
    .replace(/,\s*StyleSheet/g, '')
    .replace(/StyleSheet,\s*/g, '')
    .replace(/import \{ StyleSheet \} from 'react-native';\n/g, '');
}

function insertHooksInExportedFunctions(content) {
  const fnRegex = /export function (\w+)\(([\s\S]*?)\)\s*\{/g;
  let result = content;
  let offset = 0;
  let match;

  while ((match = fnRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const bodyOpenIndex = match.index + fullMatch.length;
    const afterBrace = content.slice(bodyOpenIndex, bodyOpenIndex + 200);

    if (afterBrace.includes('useThemedStyles(createStyles)')) {
      continue;
    }

    const needsColors =
      content.includes('colors.') || content.includes('{colors.');
    const hooks = needsColors
      ? '\n  const colors = useThemeColors();\n  const styles = useThemedStyles(createStyles);\n'
      : '\n  const styles = useThemedStyles(createStyles);\n';

    const insertAt = bodyOpenIndex + offset;
    result = result.slice(0, insertAt) + hooks + result.slice(insertAt);
    offset += hooks.length;
  }

  return result;
}

function transformFile(relativePath) {
  if (SKIP.has(relativePath)) {
    return false;
  }

  const fullPath = path.join(ROOT, relativePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  if (!content.includes('StyleSheet.create({')) {
    return false;
  }

  const styleStart = content.indexOf('const styles = StyleSheet.create({');
  if (styleStart === -1) {
    return false;
  }

  const styleEnd = content.indexOf('});', styleStart);
  if (styleEnd === -1) {
    return false;
  }

  let styleBlock = content.slice(styleStart, styleEnd + 3);
  styleBlock = styleBlock.replace(
    'const styles = StyleSheet.create({',
    'function createStyles(c: ThemeColors) {\n  return {',
  );
  styleBlock = styleBlock.replace(/\}\);$/, '};\n}');
  styleBlock = applyReplacements(styleBlock, STYLE_REPLACEMENTS);

  content = content.slice(0, styleStart) + styleBlock + content.slice(styleEnd + 3);

  for (const [pattern, replacement] of INLINE_REPLACEMENTS) {
    content = content.replace(pattern, replacement);
  }

  content = addImport(content, "import { useThemedStyles } from '@/hooks/useThemedStyles';");
  content = addImport(content, "import type { ThemeColors } from '@/theme/types';");

  if (content.includes('colors.')) {
    content = addImport(content, "import { useThemeColors } from '@/hooks/useThemeColors';");
  }

  if (!content.includes('StyleSheet.')) {
    content = removeStyleSheetImport(content);
  }

  content = insertHooksInExportedFunctions(content);

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    return true;
  }

  return false;
}

const files = listFiles();
let changed = 0;
for (const file of files) {
  if (transformFile(file)) {
    changed += 1;
    console.log('updated', file);
  }
}
console.log(`Done. Updated ${changed} files.`);
