// Documentação lida por agentes de IA não pode passar de 50 mil tokens.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LIMIT_TOKENS = 50_000;
const BYTES_PER_TOKEN = 3.5;

const files = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'README.md'];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith('.md')) files.push(path);
  }
};
walk('docs');

const bytes = files.reduce((sum, file) => sum + readFileSync(file).length, 0);
const tokens = Math.round(bytes / BYTES_PER_TOKEN);

if (tokens > LIMIT_TOKENS) {
  console.error(
    `docs: ~${tokens} tokens, acima do limite de ${LIMIT_TOKENS}. Enxugue a documentação.`,
  );
  process.exit(1);
}
console.log(`docs: ~${tokens} tokens (limite ${LIMIT_TOKENS})`);
