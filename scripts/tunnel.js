import { spawn, execSync } from 'child_process';
import fs from 'fs';

const candidatePaths = [
  'cloudflared',
  'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
  'C:\\Program Files\\cloudflared\\cloudflared.exe',
];

function resolveBinary() {
  for (const p of candidatePaths) {
    if (p === 'cloudflared') {
      try {
        execSync('cloudflared --version', { stdio: 'ignore' });
        return 'cloudflared';
      } catch {
        // não encontrado no PATH atual
      }
    } else if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

const bin = resolveBinary();

if (!bin) {
  console.error('\n❌ Cloudflared não encontrado no sistema.');
  console.error('Para instalar, execute no terminal:');
  console.error('  winget install --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements\n');
  process.exit(1);
}

console.log('\n🚀 Conectando ao Cloudflare Edge (Edge SP / GRU)...');

const args = ['tunnel', '--protocol', 'http2', '--url', 'http://localhost:5173'];
const child = spawn(bin, args, { stdio: ['inherit', 'pipe', 'pipe'] });

let urlFound = false;

function handleOutput(data) {
  const text = data.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !urlFound) {
    urlFound = true;
    const tunnelUrl = match[0];

    // Tenta copiar para o clipboard no Windows
    try {
      execSync(`powershell -NoProfile -Command "Set-Clipboard -Value '${tunnelUrl}'"`, {
        stdio: 'ignore',
      });
    } catch {
      // ignore
    }

    console.log('\n' + '═'.repeat(72));
    console.log('  🌐 TÚNEL CLOUDFLARE ATIVO (SGM v7.0)');
    console.log('═'.repeat(72));
    console.log(`\n  🔗 Link público para os jogadores:`);
    console.log(`     \x1b[32m\x1b[1m${tunnelUrl}\x1b[0m`);
    console.log(`\n  📋 (O link foi copiado para sua Área de Transferência!)`);
    console.log('\n  💡 Como funciona:');
    console.log('     • O Vite entrega o frontend pelo túnel HTTPS.');
    console.log('     • O Socket.io (/socket.io) e arquivos (/uploads) são repassados');
    console.log('       automaticamente para o servidor local Node.js (porta 3001).');
    console.log('     • Mantenha esta janela aberta enquanto a sessão estiver rolando.\n');
    console.log('═'.repeat(72) + '\n');
  }

  // Se houver erro crítico, exibe
  if (text.includes('ERR') && !text.includes('metrics')) {
    process.stderr.write(text);
  }
}

child.stdout.on('data', handleOutput);
child.stderr.on('data', handleOutput);

child.on('exit', (code) => {
  console.log(`\n🛑 Túnel encerrado (código ${code ?? 0}).`);
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});
process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
