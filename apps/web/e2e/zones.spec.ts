import { test, expect, type Page } from '@playwright/test';

// Desenho de zonas poligonais no mapa (Konva). O canvas não tem DOM, então
// os polígonos são lidos do stage do Konva.
test.skip(({ isMobile }) => isMobile, 'desenho com mouse');

const RHYTHM_MS = 120; // ritmo normal de cliques, abaixo da janela de dblclick

async function openAndPickPolygonTool(page: Page) {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.locator('header')).toBeVisible();
  await page.mouse.click(640, 400);
  await page.keyboard.press('6');
}

/** Quantidade de vértices de cada polígono fechado no mapa. */
function closedPolygons(page: Page) {
  return page.evaluate(() => {
    const konva = (
      window as unknown as {
        Konva: {
          stages: Array<{
            find: (sel: string) => Array<{
              closed: () => boolean;
              points: () => number[];
            }>;
          }>;
        };
      }
    ).Konva;
    return konva.stages[0]!.find('Line')
      .filter((line) => line.closed())
      .map((line) => line.points().length / 2);
  });
}

async function clickAll(page: Page, points: Array<[number, number]>) {
  for (const [x, y] of points) {
    await page.mouse.click(x, y);
    await page.waitForTimeout(RHYTHM_MS);
  }
}

const PENTAGON: Array<[number, number]> = [
  [400, 200],
  [650, 200],
  [750, 350],
  [600, 500],
  [400, 450],
];

test('cliques em ritmo normal não fecham o polígono antes da hora', async ({
  page,
}) => {
  await openAndPickPolygonTool(page);
  await clickAll(page, PENTAGON);

  // Só a prévia do desenho (5 vértices + cursor), nenhuma zona criada.
  expect(await closedPolygons(page)).toEqual([6]);
});

test('clicar perto do primeiro vértice fecha o polígono', async ({ page }) => {
  await openAndPickPolygonTool(page);
  await clickAll(page, PENTAGON);
  await page.mouse.click(403, 203);

  await expect.poll(() => closedPolygons(page)).toEqual([5]);
});

test('duplo-clique, mesmo um pouco torto, fecha no ponto clicado', async ({
  page,
}) => {
  await openAndPickPolygonTool(page);
  await clickAll(page, [
    [400, 200],
    [650, 200],
    [750, 350],
  ]);
  await page.mouse.click(600, 500);
  await page.waitForTimeout(60);
  await page.mouse.click(606, 504);

  await expect.poll(() => closedPolygons(page)).toEqual([4]);
});

test('Enter fecha o polígono', async ({ page }) => {
  await openAndPickPolygonTool(page);
  await clickAll(page, PENTAGON);
  await page.keyboard.press('Enter');

  await expect.poll(() => closedPolygons(page)).toEqual([5]);
});
