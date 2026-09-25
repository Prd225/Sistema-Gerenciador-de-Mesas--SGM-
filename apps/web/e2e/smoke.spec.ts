import { test, expect } from '@playwright/test';

test.describe('Smoke test — Roteiro de 4 passos', () => {
  test('executa o roteiro de 4 passos do frontend-guidelines', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('ERR_CONNECTION_REFUSED') &&
          !text.includes('Failed to load resource')
        ) {
          consoleErrors.push(text);
        }
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // Passo 1: Abrir o app e validar que carrega sem erros no console
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // Passo 2: Criar um token e verificar sua presenca no mapa / lista
    const createTokenButton = page.getByRole('button', { name: /novo token/i });
    await createTokenButton.scrollIntoViewIfNeeded();
    await expect(createTokenButton).toBeVisible();
    await createTokenButton.click();

    // Modal de criacao de token deve abrir
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByPlaceholder('Ex: Gandalf').fill('Guerreiro E2E');
    await page.getByPlaceholder('GAN', { exact: true }).fill('GE');
    await page.getByRole('button', { name: /salvar token/i }).click();

    // Modal fecha e o token aparece na lista (Token Roster)
    await expect(page.getByRole('dialog')).not.toBeVisible();
    const tokenInRoster = page.locator('header [title="Guerreiro E2E"]');
    await expect(tokenInRoster).toBeVisible();
    await expect(tokenInRoster).toHaveText('GE');

    // Passo 3: Abrir e fechar o painel do mestre
    const openMasterPanelBtn = page.getByRole('button', {
      name: /abrir painel do mestre/i,
    });
    await expect(openMasterPanelBtn).toBeVisible();
    await openMasterPanelBtn.click();

    // Validar abertura do painel do mestre
    const masterPanelHeading = page.locator('text=Painel do Mestre').first();
    await expect(masterPanelHeading).toBeVisible();

    // Fechar painel do mestre
    const closeMasterPanelBtn = page.getByRole('button', {
      name: /fechar painel do mestre/i,
    });
    await expect(closeMasterPanelBtn).toBeVisible();
    await closeMasterPanelBtn.click();
    await expect(masterPanelHeading).not.toBeVisible();

    // Passo 4: Recarregar a pagina (F5 / page.reload()) e validar persistencia do token
    // Aguarda sincronizacao do estado com IndexedDB
    await page.waitForFunction(
      async () => {
        return new Promise<boolean>((resolve) => {
          const req = indexedDB.open('SGMDatabase');
          req.onsuccess = () => {
            const idb = req.result;
            if (!idb.objectStoreNames.contains('sessionState')) {
              idb.close();
              resolve(false);
              return;
            }
            const tx = idb.transaction('sessionState', 'readonly');
            const store = tx.objectStore('sessionState');
            const getReq = store.get('currentSession');
            getReq.onsuccess = () => {
              const item = getReq.result;
              const tokens = item?.data?.tokens?.tokens;
              idb.close();
              resolve(
                Array.isArray(tokens) &&
                  tokens.some((t: any) => t.fullName === 'Guerreiro E2E'),
              );
            };
            getReq.onerror = () => {
              idb.close();
              resolve(false);
            };
          };
          req.onerror = () => resolve(false);
        });
      },
      { timeout: 15000, polling: 500 },
    );

    await page.reload();

    // Valida que o token continua presente no estado persistido apos o reload
    const persistedToken = page.locator('header [title="Guerreiro E2E"]');
    await expect(persistedToken).toBeVisible({ timeout: 15000 });
    await expect(persistedToken).toHaveText('GE');
  });
});
