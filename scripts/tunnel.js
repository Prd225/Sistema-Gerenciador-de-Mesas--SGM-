import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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

// Usamos 127.0.0.1 em vez de localhost para evitar tentativas em IPv6 (::1) no Windows
const args = ['tunnel', '--protocol', 'http2', '--url', 'http://127.0.0.1:5173'];
const child = spawn(bin, args, { stdio: ['inherit', 'pipe', 'pipe'] });

let urlFound = false;
let currentUrl = '';

function isIgnorableWarning(text) {
  return (
    text.includes('context canceled') ||
    text.includes('Incoming request ended abruptly') ||
    text.includes('metrics') ||
    text.includes('origin-ca-pool') ||
    text.includes('connectivity pre-checks')
  );
}

function handleOutput(data) {
  const text = data.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  
  if (match && !urlFound) {
    urlFound = true;
    currentUrl = match[0];

    // Salva o link num arquivo de texto para consulta rápida
    try {
      fs.writeFileSync(path.resolve(process.cwd(), 'tunnel-url.txt'), currentUrl, 'utf-8');
    } catch {
      // ignore
    }

    // Tenta copiar para o clipboard no Windows
    try {
      execSync(`powershell -NoProfile -Command "Set-Clipboard -Value '${currentUrl}'"`, {
        stdio: 'ignore',
      });
    } catch {
      // ignore
    }

    console.log('\n' + '='.repeat(70));
    console.log('  🌐 TÚNEL CLOUDFLARE ONLINE COM SUCESSO! (SGM v7.0)');
    console.log('='.repeat(70));
    console.log('');
    console.log('  👉 LINK PARA COMPARTILHAR COM OS JOGADORES:');
    console.log(`     ${currentUrl}`);
    console.log('');
    console.log('  📋 O link já foi copiado para a sua Área de Transferência!');
    console.log('  📁 Também foi salvo no arquivo: tunnel-url.txt');
    console.log('');
    console.log('  ℹ️  Como funciona:');
    console.log('     • Seus amigos entram direto pelo link acima com HTTPS.');
    console.log('     • Não precisa de Hamachi, Radmin nem abrir portas no roteador.');
    console.log('     • Mantenha este terminal aberto durante toda a sessão.');
    console.log('='.repeat(70) + '\n');
  }

  // Se houver erro crítico real (ignorando desconexões normais de navegação/reload do browser)
  if (text.includes('ERR') && !isIgnorableWarning(text)) {
    console.error(`[Aviso do Túnel]: ${text.trim()}`);
  }
}

child.stdout.on('data', handleOutput);
child.stderr.on('data', handleOutput);

child.on('exit', (code) => {
  try {
    const txtPath = path.resolve(process.cwd(), 'tunnel-url.txt');
    if (fs.existsSync(txtPath)) {
      fs.unlinkSync(txtPath);
    }
  } catch {
    // ignore
  }
  console.log(`\n🛑 Túnel encerrado (código ${code ?? 0}).`);
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});
process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
