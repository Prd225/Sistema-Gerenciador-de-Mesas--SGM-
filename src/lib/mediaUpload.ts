/**
 * Utilitário central de streaming e upload de arquivos de mídia.
 * Envia o arquivo binário diretamente via stream HTTP sem converter para base64,
 * retornando a rota local servida pelo backend ('/uploads/handouts/...').
 * 
 * Isso evita qualquer alocação excessiva de memória no navegador e elimina
 * o erro "The structured clone is too large" do IndexedDB.
 */
export async function uploadMediaFile(
  file: File,
  customId?: string,
): Promise<{ url: string; filename: string }> {
  const id =
    customId ||
    (window.crypto?.randomUUID?.() ??
      Math.random().toString(36).substring(2, 11));

  try {
    const res = await fetch(
      `/api/handouts/upload-raw?id=${id}&name=${encodeURIComponent(file.name)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-file-id': id,
          'x-file-name': encodeURIComponent(file.name),
        },
        body: file, // Envia o Blob/File binário diretamente por stream (Zero overhead de memória JS)
      },
    );

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return { url: data.url, filename: data.filename || file.name };
      }
    }
  } catch (e) {
    console.warn(
      '[Upload Media] Falha ao enviar via stream para backend local, usando fallback efêmero:',
      e,
    );
  }

  // Fallback seguro offline: ponteiro Blob efêmero mantido pelo navegador sem persistir base64 pesado
  const ephemeralUrl = URL.createObjectURL(file);
  return { url: ephemeralUrl, filename: file.name };
}
