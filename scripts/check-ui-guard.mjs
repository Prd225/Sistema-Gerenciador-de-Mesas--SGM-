#!/usr/bin/env node
/**
 * Guarda de UI: procura em apps/web/src hexadecimal solto, `text-[Npx]`,
 * `z-[N]`, `alert(`, `confirm(`, `prompt(`.
 *
 * Compara com scripts/ui-guard-exceptions.json (contagem atual por
 * arquivo/violacao). Falha se um arquivo novo violar OU se uma contagem
 * subir. Avisa quando uma contagem cai (lista so diminui).
 *
 * docs/specs/ui-design-system.md, secao 5. Chamado por `npm run ui:guard`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'apps/web/src');
const exceptionsPath = join(__dirname, 'ui-guard-exceptions.json');

const EXEMPT_FILES = new Set([
  'apps/web/src/ui/tokens.ts',
  'apps/web/src/index.css',
]);

const RULES = [
  {
    id: 'hex-color',
    // #rgb, #rrggbb ou #rrggbbaa em código (aspas, template ou valor CSS)
    regex:
      /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g,
    extensions: ['.ts', '.tsx', '.css'],
  },
  {
    id: 'text-px-arbitrary',
    regex: /text-\[\d+px\]/g,
    extensions: ['.ts', '.tsx'],
  },
  {
    id: 'z-arbitrary',
    regex: /z-\[\d+\]/g,
    extensions: ['.ts', '.tsx'],
  },
  {
    id: 'alert-call',
    regex: /\balert\(/g,
    extensions: ['.ts', '.tsx'],
  },
  {
    id: 'confirm-call',
    regex: /\bconfirm\(/g,
    extensions: ['.ts', '.tsx'],
  },
  {
    id: 'prompt-call',
    regex: /\bprompt\(/g,
    extensions: ['.ts', '.tsx'],
  },
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function countViolations(content, regex) {
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

function main() {
  const files = walk(srcDir);
  /** @type {Record<string, Record<string, number>>} */
  const current = {};

  for (const absPath of files) {
    const relPath = relative(rootDir, absPath).split('\\').join('/');
    if (EXEMPT_FILES.has(relPath)) continue;

    const content = readFileSync(absPath, 'utf8');
    for (const rule of RULES) {
      if (!rule.extensions.some((ext) => absPath.endsWith(ext))) continue;
      const count = countViolations(content, rule.regex);
      if (count > 0) {
        current[relPath] ??= {};
        current[relPath][rule.id] = count;
      }
    }
  }

  /** @type {Record<string, Record<string, number>>} */
  let exceptions = {};
  try {
    exceptions = JSON.parse(readFileSync(exceptionsPath, 'utf8'));
  } catch {
    exceptions = {};
  }

  const errors = [];
  const warnings = [];

  for (const [file, violations] of Object.entries(current)) {
    const known = exceptions[file] ?? {};
    for (const [ruleId, count] of Object.entries(violations)) {
      const allowed = known[ruleId] ?? 0;
      if (allowed === 0) {
        errors.push(
          `${file}: ${count}x "${ruleId}" (arquivo novo, sem exceção)`,
        );
      } else if (count > allowed) {
        errors.push(
          `${file}: ${count}x "${ruleId}" (exceção permite ${allowed}, contagem subiu)`,
        );
      }
    }
  }

  for (const [file, violations] of Object.entries(exceptions)) {
    for (const [ruleId, allowed] of Object.entries(violations)) {
      const count = current[file]?.[ruleId] ?? 0;
      if (count < allowed) {
        warnings.push(
          `${file}: "${ruleId}" caiu de ${allowed} para ${count} — atualize scripts/ui-guard-exceptions.json`,
        );
      }
    }
  }

  if (warnings.length > 0) {
    console.warn('Avisos da guarda de UI (contagem caiu, atualize a lista):');
    for (const warning of warnings) console.warn(`  - ${warning}`);
  }

  if (errors.length > 0) {
    console.error('Guarda de UI falhou:');
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log('Guarda de UI ok.');
}

main();
