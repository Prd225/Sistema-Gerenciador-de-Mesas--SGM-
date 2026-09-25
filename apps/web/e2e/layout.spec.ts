import { test, expect, type Page } from '@playwright/test';

// O botão "Expandir" fica sempre no DOM (só transparente), por isso o estado
// aberto/fechado é conferido pelo botão "Recolher", que some de verdade.
// Regressões de layout em telas estreitas. Cada teste define a própria
// largura, então roda só no projeto Desktop para não duplicar.
test.skip(({ isMobile }) => isMobile, 'define o proprio viewport');

const HEIGHT = 700;

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: HEIGHT });
  await page.goto('/');
  await expect(page.locator('header')).toBeVisible();
}

const expandZone = (page: Page) =>
  page.getByRole('button', { name: 'Expandir barra da zona' });
const collapseZone = (page: Page) =>
  page.getByRole('button', { name: 'Recolher barra da zona' }).first();
const expandMarkers = (page: Page) =>
  page.getByRole('button', { name: 'Expandir marcadores' });
const collapseMarkers = (page: Page) =>
  page.getByRole('button', { name: 'Recolher marcadores' });

test.describe('Sidebars', () => {
  for (const width of [700, 1024, 1280]) {
    test(`botão de recolher a barra da zona fica clicável (${width}px)`, async ({
      page,
    }) => {
      await open(page, width);
      await expandMarkers(page).click();
      await expandZone(page).click();

      // `trial` faz as checagens de clique (visível, estável, não coberto por
      // outro elemento) sem clicar. Falha se a sidebar direita cobrir o botão.
      await collapseZone(page).click({ trial: true });
      await collapseZone(page).click();
      await expect(collapseZone(page)).toBeHidden();
    });
  }

  test('abaixo de 1024 px abrir uma barra fecha a outra', async ({ page }) => {
    await open(page, 700);

    await expandMarkers(page).click();
    await expandZone(page).click();
    await expect(collapseMarkers(page)).toBeHidden();
    await expect(collapseZone(page)).toBeVisible();

    await expandMarkers(page).click();
    await expect(collapseZone(page)).toBeHidden();
    await expect(collapseMarkers(page)).toBeVisible();
  });

  test('a partir de 1024 px as duas barras ficam abertas juntas', async ({
    page,
  }) => {
    await open(page, 1280);
    await expandMarkers(page).click();
    await expandZone(page).click();

    await expect(collapseMarkers(page)).toBeVisible();
    await expect(collapseZone(page)).toBeVisible();
  });

  test('estreitar a janela com as duas abertas fecha a da zona', async ({
    page,
  }) => {
    await open(page, 1280);
    await expandMarkers(page).click();
    await expandZone(page).click();

    await page.setViewportSize({ width: 700, height: HEIGHT });
    await expect(collapseZone(page)).toBeHidden();
    await expect(collapseMarkers(page)).toBeVisible();
  });
});

test.describe('Rodapé', () => {
  test('em tela estreita rola na horizontal sem cortar o começo nem o fim', async ({
    page,
  }) => {
    await open(page, 420);
    const footer = page.locator('footer');
    const box = await footer.boundingBox();
    if (!box) throw new Error('rodapé sem caixa');

    const overflows = await footer.evaluate(
      (el) => el.scrollWidth > el.clientWidth,
    );
    expect(overflows).toBe(true);

    // Primeiro item (cronômetro) começa dentro da tela, não cortado à esquerda.
    const timer = footer.getByText('00:00', { exact: true });
    const timerBox = await timer.boundingBox();
    expect(timerBox?.x ?? -1).toBeGreaterThanOrEqual(box.x);

    // Último item (botão Cena) é alcançável rolando.
    const scene = footer.getByRole('button', { name: /^cena$/i });
    await scene.scrollIntoViewIfNeeded();
    const sceneBox = await scene.boundingBox();
    if (!sceneBox) throw new Error('botão Cena sem caixa');
    expect(sceneBox.x + sceneBox.width).toBeLessThanOrEqual(
      box.x + box.width + 1,
    );
  });

  test('em tela larga cabe sem rolagem', async ({ page }) => {
    await open(page, 1600);
    const overflows = await page
      .locator('footer')
      .evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflows).toBe(false);
  });

  for (const width of [420, 1280]) {
    test(`indicador de urgência fica em uma linha (${width}px)`, async ({
      page,
    }) => {
      await open(page, width);
      const urgency = page.locator('footer').getByText('---', { exact: true });
      await urgency.scrollIntoViewIfNeeded();
      const urgencyBox = await urgency.boundingBox();
      // Uma linha tem ~22 px (1.4rem, leading-none); quebrada passa de 40.
      expect(urgencyBox?.height ?? 999).toBeLessThan(35);
    });
  }
});

test.describe('Página', () => {
  for (const width of [390, 1024, 1440]) {
    test(`sem rolagem horizontal da página (${width}px)`, async ({ page }) => {
      await open(page, width);
      const scrolls = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(scrolls).toBe(false);
    });
  }
});

test.describe('Painel do mestre', () => {
  test('alças do painel têm área de toque de 44 px e a de fechar ocupa o topo', async ({
    page,
  }) => {
    await open(page, 390);
    const openHandle = page.getByRole('button', {
      name: 'Abrir Painel do Mestre',
    });
    const openBox = await openHandle.boundingBox();
    expect(openBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(openBox?.width ?? 0).toBeGreaterThanOrEqual(44);

    await openHandle.click();
    const closeBox = await page
      .getByRole('button', { name: 'Fechar Painel do Mestre' })
      .boundingBox();
    expect(closeBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    // A faixa inteira do topo fecha o painel.
    expect(closeBox?.width ?? 0).toBeGreaterThanOrEqual(390 - 1);
  });
});
