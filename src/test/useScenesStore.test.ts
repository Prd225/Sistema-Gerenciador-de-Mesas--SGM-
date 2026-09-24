import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { useScenesStore } from '@/store/useScenesStore';
import { useTokenStore } from '@/store/useTokenStore';
import { useZoneStore } from '@/store/useZoneStore';

describe('useScenesStore — Troca de Cenas e Mapas', () => {
  beforeEach(async () => {
    await db.activeScenes.clear();
    useTokenStore.setState({ tokens: [], initiativeQueue: [] });
    useZoneStore.setState({ zones: {}, markers: {}, bgImages: [] });

    // Reseta store de cenas com uma cena inicial
    const initialSceneId = 'scene-init-1';
    await db.activeScenes.put({
      id: initialSceneId,
      tokens: [],
      initiativeQueue: [],
      zones: {},
      markers: {},
      bgImages: [],
    });

    useScenesStore.setState({
      scenes: [{ id: initialSceneId, name: 'Cena Inicial' }],
      activeSceneId: initialSceneId,
      isSwitching: false,
    });
  });

  it('adiciona nova cena e a registra no Dexie', async () => {
    await useScenesStore.getState().addScene('Mansao Assombrada');

    const state = useScenesStore.getState();
    expect(state.scenes).toHaveLength(2);
    expect(state.scenes[1].name).toContain('Mansao Assombrada');

    const newSceneId = state.scenes[1].id;
    const sceneInDb = await db.activeScenes.get(newSceneId);
    expect(sceneInDb).toBeDefined();
    expect(sceneInDb?.tokens).toEqual([]);
  });

  it('permite renomear uma cena existente', () => {
    const currentId = useScenesStore.getState().scenes[0].id;
    useScenesStore.getState().renameScene(currentId, 'Cena Renomeada');

    expect(useScenesStore.getState().scenes[0].name).toBe('Cena Renomeada');
  });

  it('salva estado da cena atual e injeta dados da cena destino ao trocar de cena', async () => {
    const store = useScenesStore.getState();
    const scene1Id = store.activeSceneId!;

    // Adiciona token e imagem na Cena 1
    useTokenStore.setState({
      tokens: [
        {
          id: 'tok-scene-1',
          name: 'Monstro Cena 1',
          fullName: 'Monstro Cena 1',
          colorText: '#fff',
          colorBorder: '#000',
          colorFill: '#333',
          x: 50,
          y: 60,
          desc: '',
          conditions: [],
          stats: {
            type: 'threat',
            system: 'san',
            agi: 1,
            for: 1,
            int: 1,
            pre: 1,
            vig: 1,
            def: 10,
            bloq: 10,
            esq: 10,
            pv: 50,
            maxPv: 50,
            pe: 0,
            maxPe: 0,
            san: 0,
            maxSan: 0,
            pd: 0,
            maxPd: 0,
          },
        },
      ],
      initiativeQueue: [],
    });

    useZoneStore.setState({
      bgImages: [
        {
          id: 'bg-map-1',
          src: 'https://exemplo.com/mapa1.jpg',
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
        },
      ],
      zones: {},
      markers: {},
    });

    // Cria Cena 2 com dados diferentes pre-populados no Dexie
    const scene2Id = 'scene-2-id';
    await db.activeScenes.put({
      id: scene2Id,
      tokens: [],
      initiativeQueue: [],
      zones: {},
      markers: {},
      bgImages: [
        {
          id: 'bg-map-2',
          src: 'https://exemplo.com/mapa2.jpg',
          x: 100,
          y: 100,
          scale: 1.5,
          rotation: 90,
        },
      ],
    });

    useScenesStore.setState({
      scenes: [...store.scenes, { id: scene2Id, name: 'Cena 2' }],
    });

    // Troca da Cena 1 para a Cena 2
    await useScenesStore.getState().switchScene(scene2Id);

    // Verifica se os dados da Cena 1 foram salvos no Dexie
    const savedScene1 = await db.activeScenes.get(scene1Id);
    expect(savedScene1?.tokens).toHaveLength(1);
    expect(savedScene1?.tokens[0].id).toBe('tok-scene-1');
    expect(savedScene1?.bgImages[0].id).toBe('bg-map-1');

    // Verifica se os stores globais receberam os dados da Cena 2
    expect(useScenesStore.getState().activeSceneId).toBe(scene2Id);
    expect(useTokenStore.getState().tokens).toHaveLength(0);
    expect(useZoneStore.getState().bgImages).toHaveLength(1);
    expect(useZoneStore.getState().bgImages[0].id).toBe('bg-map-2');
  });

  it('remove cena e migra para cena ativa remanescente', async () => {
    const scene1Id = useScenesStore.getState().scenes[0].id;

    // Cria Cena 2
    await useScenesStore.getState().addScene('Cena Secundária');
    const scene2Id = useScenesStore.getState().scenes[1].id;

    // Remove Cena 1 (que era a ativa)
    await useScenesStore.getState().removeScene(scene1Id);

    expect(useScenesStore.getState().scenes).toHaveLength(1);
    expect(useScenesStore.getState().activeSceneId).toBe(scene2Id);

    const deletedInDb = await db.activeScenes.get(scene1Id);
    expect(deletedInDb).toBeUndefined();

    // Tentar remover a ultima cena nao deve fazer nada
    await useScenesStore.getState().removeScene(scene2Id);
    expect(useScenesStore.getState().scenes).toHaveLength(1);
  });
});
