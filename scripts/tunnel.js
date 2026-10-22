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

// Flags otimizadas para baixa latência e estabilidade máxima
const TUNNEL_ARGS = [
  'tunnel',
  '--protocol',
  'http2',
  '--edge-ip-version',
  '4',
  '--retries',
  '10',
  '--no-autoupdate',
  '--url',
  'http://127.0.0.1:5173',
];

let isShuttingDown = false;
let currentChild = null;
let reconnectTimer = null;
let reconnectCount = 0;
let currentUrl = '';

function isIgnorableLog(text) {
  return (
    text.includes('context canceled') ||
    text.includes('Incoming request ended abruptly') ||
    text.includes('metrics') ||
    text.includes('origin-ca-pool') ||
    text.includes('connectivity pre-checks')
  );
}

function cleanUpFiles() {
  try {
    const txtPath = path.resolve(process.cwd(), 'tunnel-url.txt');
    if (fs.existsSync(txtPath)) {
      fs.unlinkSync(txtPath);
    }
  } catch {
    // ignore
  }
}

function startTunnel() {
  if (isShuttingDown) return;

  const isReconnecting = reconnectCount > 0;
  if (!isReconnecting) {
    console.log('\n🚀 Conectando ao Cloudflare Edge (Edge SP / GRU com HTTP/2)...');
  } else {
    console.log(`\n🔄 Reconectando ao Cloudflare Edge (Tentativa #${reconnectCount})...`);
  }

  let urlDetectedThisSession = false;
  currentChild = spawn(bin, TUNNEL_ARGS, { stdio: ['inherit', 'pipe', 'pipe'] });

  function handleOutput(data) {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);

    if (match && !urlDetectedThisSession) {
      urlDetectedThisSession = true;
      reconnectCount = 0;
      currentUrl = match[0];

      // Salva no arquivo de consulta rápida
      try {
        fs.writeFileSync(path.resolve(process.cwd(), 'tunnel-url.txt'), currentUrl, 'utf-8');
      } catch {
        // ignore
      }

      // Copia para área de transferência
      try {
        execSync(`powershell -NoProfile -Command "Set-Clipboard -Value '${currentUrl}'"`, {
          stdio: 'ignore',
        });
      } catch {
        // ignore
      }

      const now = new Date().toLocaleTimeString();
      console.log('\n' + '='.repeat(70));
      console.log(`  🌐 TÚNEL CLOUDFLARE ATIVO & OTIMIZADO [${now}] (SGM v7.0)`);
      console.log('='.repeat(70));
      console.log('');
      console.log('  👉 LINK PARA COMPARTILHAR COM OS JOGADORES:');
      console.log(`     \x1b[32m\x1b[1m${currentUrl}\x1b[0m`);
      console.log('');
      console.log('  ⚡ Otimizações ativas:');
      console.log('     • Protocolo HTTP/2 Multiplexado com IPv4 direto (Edge GRU/SP)');
      console.log('     • WebSocket puro direto (sem delay de polling)');
      console.log('     • Heartbeat de 5s para evitar desconexões por inatividade');
      console.log('     • Reconexão automática ativa caso a conexão sofra queda');
      console.log('');
      console.log('  📋 O link já está na sua Área de Transferência (Ctrl+V)!');
      console.log('  📁 Salvo no arquivo: tunnel-url.txt');
      console.log('='.repeat(70) + '\n');
    }

    if (text.includes('ERR') && !isIgnorableLog(text)) {
      console.error(`[Aviso do Túnel]: ${text.trim()}`);
    }
  }

  currentChild.stdout.on('data', handleOutput);
  currentChild.stderr.on('data', handleOutput);

  currentChild.on('exit', (code) => {
    currentChild = null;

    if (isShuttingDown) {
      cleanUpFiles();
      console.log(`\n🛑 Túnel encerrado com sucesso.`);
      process.exit(0);
    }

    // Se saiu sozinho (queda de rede, timeout do Edge), faz a reconexão automática
    reconnectCount++;
    const delay = Math.min(1000 + (reconnectCount - 1) * 500, 3000);
    console.log(`\n⚠️  Conexão com o Cloudflare Edge interrompida (código ${code ?? 0}).`);
    console.log(`⏳ Reconectando automaticamente em ${delay / 1000}s...`);

    reconnectTimer = setTimeout(() => {
      startTunnel();
    }, delay);
  });
}

function handleShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  cleanUpFiles();
  if (currentChild) {
    currentChild.kill('SIGINT');
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Inicialização
startTunnel();
