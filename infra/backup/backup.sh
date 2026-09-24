#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DAILY_DIR="${BACKUP_DIR}/daily"
WEEKLY_DIR="${BACKUP_DIR}/weekly"

mkdir -p "${DAILY_DIR}" "${WEEKLY_DIR}"

echo "[backup] Servico de backup iniciado. Aguardando banco de dados..."

until pg_isready -h "${PGHOST:-postgres}" -U "${PGUSER:-sgm}" -d "${PGDATABASE:-sgm_prod}"; do
  echo "[backup] Banco nao disponivel ainda. Aguardando 5 segundos..."
  sleep 5
done

echo "[backup] Conexao com banco estabelecida. Executando rotina..."

while true; do
  DATE="$(date +%Y%m%d_%H%M%S)"
  DOW="$(date +%u)"

  echo "[backup] [${DATE}] Iniciando backup do banco de dados..."
  pg_dump -Fc -h "${PGHOST:-postgres}" -U "${PGUSER:-sgm}" "${PGDATABASE:-sgm_prod}" > "${DAILY_DIR}/db_${DATE}.dump"

  if [ -d "/data/media" ] && [ "$(ls -A /data/media 2>/dev/null)" ]; then
    echo "[backup] [${DATE}] Realizando backup dos arquivos de midia..."
    tar -czf "${DAILY_DIR}/media_${DATE}.tar.gz" -C /data/media .
  fi

  # Backup semanal no domingo (DOW = 7)
  if [ "${DOW}" -eq 7 ]; then
    echo "[backup] [${DATE}] Criando copia semanal..."
    cp "${DAILY_DIR}/db_${DATE}.dump" "${WEEKLY_DIR}/"
    if [ -f "${DAILY_DIR}/media_${DATE}.tar.gz" ]; then
      cp "${DAILY_DIR}/media_${DATE}.tar.gz" "${WEEKLY_DIR}/"
    fi
  fi

  # Retencao: 7 diarios e 4 semanais (28 dias)
  echo "[backup] [${DATE}] Aplicando politicas de retencao..."
  find "${DAILY_DIR}" -type f -mtime +7 -delete || true
  find "${WEEKLY_DIR}" -type f -mtime +28 -delete || true

  echo "[backup] [${DATE}] Backup concluido. Proxima execucao em 24 horas."
  sleep 86400
done
