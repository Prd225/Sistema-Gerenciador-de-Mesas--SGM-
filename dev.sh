#!/usr/bin/env bash

set -e

# Diretorio raiz do projeto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=================================================="
echo " Sistema Gerenciador de Mesas (SGM v7.0)"
echo " Iniciando Cliente (Vite) e Servidor (Socket.io)"
echo "=================================================="

# Verifica instalacao de dependencias
if [ ! -d "node_modules" ]; then
  echo "[SGM] Diretorio node_modules nao localizado. Instalando dependencias..."
  npm install
fi

# Executa o cliente e o servidor simultaneamente
echo "[SGM] Subindo servicos em paralelo:"
echo "      - Cliente:  http://localhost:5173"
echo "      - Servidor: http://localhost:3001 (ws://localhost:3001)"
echo "--------------------------------------------------"

exec npm run dev
