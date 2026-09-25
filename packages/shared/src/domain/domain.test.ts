import { describe, it, expect } from 'vitest';
import {
  Campaign,
  TableState,
  Scene,
  Token,
  Background,
  Marker,
  Zone,
  InitiativeState,
  PanelState,
  RoomMember,
  MemberRole,
} from './index';

describe('Domain Schemas', () => {
  const sampleUuid1 = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
  const sampleUuid2 = 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e';
  const sampleIsoDate = '2026-09-24T20:00:00.000Z';

  describe('Token', () => {
    it('valida token valido com imageRef e campos obrigatorios', () => {
      const validToken = {
        id: sampleUuid1,
        name: 'Guerreiro Investigador',
        ownerMemberId: sampleUuid2,
        visibility: 'all',
        imageRef: 'media/tokens/investigador.webp',
        x: 100,
        y: 200,
        size: 1,
      };

      const result = Token.safeParse(validToken);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Guerreiro Investigador');
        expect(result.data.visibility).toBe('all');
        expect(result.data.conditions).toEqual([]);
      }
    });

    it('aceita token do mestre com ownerMemberId nulo e visibilidade gm', () => {
      const gmToken = {
        id: sampleUuid1,
        name: 'Monstro das Sombras',
        ownerMemberId: null,
        visibility: 'gm',
        imageRef: null,
        x: 50,
        y: 80,
        size: 2,
      };

      const result = Token.safeParse(gmToken);
      expect(result.success).toBe(true);
    });

    it('rejeita token com visibilidade invalida', () => {
      const invalid = {
        id: sampleUuid1,
        name: 'Token Invalido',
        ownerMemberId: null,
        visibility: 'invisible',
        imageRef: null,
        x: 0,
        y: 0,
        size: 1,
      };

      const result = Token.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejeita token com tamanho menor ou igual a zero', () => {
      const invalid = {
        id: sampleUuid1,
        name: 'Tamanho Zero',
        ownerMemberId: null,
        visibility: 'all',
        imageRef: null,
        x: 0,
        y: 0,
        size: 0,
      };

      const result = Token.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejeita token com imageRef que excede o limite de 255 caracteres', () => {
      const invalid = {
        id: sampleUuid1,
        name: 'Token Imagem Longa',
        ownerMemberId: null,
        visibility: 'all',
        imageRef: 'a'.repeat(256),
        x: 0,
        y: 0,
        size: 1,
      };

      const result = Token.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Background', () => {
    it('valida background com imageRef e coordenadas', () => {
      const bg = {
        id: sampleUuid1,
        imageRef: 'media/maps/mansao-piso1.webp',
        x: 0,
        y: 0,
        scale: 1.0,
        rotation: 0,
      };

      const result = Background.safeParse(bg);
      expect(result.success).toBe(true);
    });

    it('rejeita background com imageRef vazio', () => {
      const invalid = {
        id: sampleUuid1,
        imageRef: '',
        x: 0,
        y: 0,
        scale: 1.0,
        rotation: 0,
      };

      const result = Background.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Marker', () => {
    it('valida marker com texto e propriedades opcionais', () => {
      const marker = {
        id: sampleUuid1,
        x: 120,
        y: 340,
        text: 'Porta Trancada',
        description: 'Exige teste de Forca DT 20 para arrombar',
        iconType: 'pin',
        hidden: true,
      };

      const result = Marker.safeParse(marker);
      expect(result.success).toBe(true);
    });

    it('rejeita marker com texto excedendo 100 caracteres', () => {
      const invalid = {
        id: sampleUuid1,
        x: 0,
        y: 0,
        text: 'm'.repeat(101),
      };

      const result = Marker.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Zone', () => {
    it('valida zone retangular com dados e sem base64', () => {
      const zone = {
        id: sampleUuid1,
        type: 'rect',
        x: 10,
        y: 20,
        w: 200,
        h: 150,
        data: {
          title: 'Biblioteca Abandonada',
          desc: 'Estantes repletas de livros mofados',
          visits: 1,
          imageRef: 'media/zones/biblioteca.webp',
        },
      };

      const result = Zone.safeParse(zone);
      expect(result.success).toBe(true);
    });

    it('rejeita visits negativo em zone data', () => {
      const invalid = {
        id: sampleUuid1,
        type: 'rect',
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        data: {
          title: 'Zona',
          desc: 'Descricao',
          visits: -1,
        },
      };

      const result = Zone.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('InitiativeState', () => {
    it('valida estado de iniciativa com ordem e pontuacoes', () => {
      const initiative = {
        order: [sampleUuid1, sampleUuid2],
        values: {
          [sampleUuid1]: 24,
          [sampleUuid2]: 15,
        },
      };

      const result = InitiativeState.safeParse(initiative);
      expect(result.success).toBe(true);
    });
  });

  describe('Scene', () => {
    it('valida cena com colecoes indexadas por Record<id, T>', () => {
      const scene = {
        id: sampleUuid1,
        name: 'Prédio em Ruínas',
        tokens: {
          [sampleUuid2]: {
            id: sampleUuid2,
            name: 'Ocultista',
            ownerMemberId: null,
            visibility: 'all',
            imageRef: null,
            x: 50,
            y: 50,
            size: 1,
          },
        },
        zones: {},
        markers: {},
        backgrounds: {},
        initiative: {
          order: [sampleUuid2],
          values: { [sampleUuid2]: 18 },
        },
      };

      const result = Scene.safeParse(scene);
      expect(result.success).toBe(true);
    });

    it('rejeita cena com nome vazio', () => {
      const invalid = {
        id: sampleUuid1,
        name: '',
        tokens: {},
        zones: {},
        markers: {},
        backgrounds: {},
        initiative: { order: [], values: {} },
      };

      const result = Scene.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('TableState', () => {
    it('valida mesa vazia inicial', () => {
      const table = {
        version: 0,
        activeSceneId: null,
        round: 0,
        turn: 0,
        scenes: {},
      };

      const result = TableState.safeParse(table);
      expect(result.success).toBe(true);
    });

    it('rejeita versao negativa', () => {
      const invalid = {
        version: -1,
        activeSceneId: null,
        round: 0,
        turn: 0,
        scenes: {},
      };

      const result = TableState.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('PanelState', () => {
    it('valida panel com todas as sessoes em records', () => {
      const panel = {
        diary: {},
        notes: {},
        rules: {},
        tables: {},
        roulettes: {},
        soundpad: {},
      };

      const result = PanelState.safeParse(panel);
      expect(result.success).toBe(true);
    });
  });

  describe('Campaign', () => {
    it('valida campanha completa com table e panel', () => {
      const campaign = {
        id: sampleUuid1,
        name: 'Campanha Ordo Realitas',
        updatedAt: sampleIsoDate,
        table: {
          version: 1,
          activeSceneId: sampleUuid2,
          round: 1,
          turn: 1,
          scenes: {
            [sampleUuid2]: {
              id: sampleUuid2,
              name: 'Mansao Principal',
              tokens: {},
              zones: {},
              markers: {},
              backgrounds: {},
              initiative: { order: [], values: {} },
            },
          },
        },
        panel: {
          diary: {},
          notes: {},
          rules: {},
          tables: {},
          roulettes: {},
          soundpad: {},
        },
      };

      const result = Campaign.safeParse(campaign);
      expect(result.success).toBe(true);
    });

    it('rejeita campanha com data que nao segue ISO 8601 datetime', () => {
      const invalid = {
        id: sampleUuid1,
        name: 'Campanha Data Invalida',
        updatedAt: '24/09/2026',
        table: {
          version: 0,
          activeSceneId: null,
          round: 0,
          turn: 0,
          scenes: {},
        },
        panel: {
          diary: {},
          notes: {},
          rules: {},
          tables: {},
          roulettes: {},
          soundpad: {},
        },
      };

      const result = Campaign.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('RoomMember & MemberRole', () => {
    it('aceita papeis gm, player e spectator', () => {
      expect(MemberRole.safeParse('gm').success).toBe(true);
      expect(MemberRole.safeParse('player').success).toBe(true);
      expect(MemberRole.safeParse('spectator').success).toBe(true);
      expect(MemberRole.safeParse('admin').success).toBe(false);
    });

    it('valida membro da sala com id uuid e papel valido', () => {
      const member = {
        id: sampleUuid1,
        name: 'Mestre Ronald',
        role: 'gm',
        color: '#ff4444',
      };

      const result = RoomMember.safeParse(member);
      expect(result.success).toBe(true);
    });
  });
});
