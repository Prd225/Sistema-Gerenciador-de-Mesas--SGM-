import { describe, it, expect } from 'vitest';
import {
  CommandEnvelope,
  Cmd,
  AckEnvelope,
  Ack,
  EventEnvelope,
  Evt,
  SnapshotEnvelope,
  Snapshot,
  ErrorCode,
  CommandType,
  EventType,
  TokenMovePayload,
  TokenCreatePayload,
  TokenUpdatePayload,
  TokenDeletePayload,
  ZoneCreatePayload,
  ZoneUpdatePayload,
  ZoneDeletePayload,
  MarkerCreatePayload,
  MarkerUpdatePayload,
  MarkerDeletePayload,
  BackgroundCreatePayload,
  BackgroundUpdatePayload,
  BackgroundDeletePayload,
  SceneCreatePayload,
  SceneUpdatePayload,
  SceneDeletePayload,
  SceneActivatePayload,
  InitiativeUpdatePayload,
  RoundNextPayload,
  TurnNextPayload,
  PingPayload,
} from './index';

describe('Protocol Schemas & Envelopes', () => {
  const sampleUuid1 = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
  const sampleUuid2 = 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e';

  describe('ErrorCode', () => {
    it('reconhece todos os codigos de erro da secao 4 do spec', () => {
      const expectedCodes = [
        'INVALID_PAYLOAD',
        'FORBIDDEN',
        'NOT_FOUND',
        'CONFLICT',
        'RATE_LIMITED',
        'ROOM_CLOSED',
      ];

      for (const code of expectedCodes) {
        expect(ErrorCode.safeParse(code).success).toBe(true);
      }
      expect(ErrorCode.safeParse('UNKNOWN_ERROR').success).toBe(false);
    });
  });

  describe('Command Envelope (cmd)', () => {
    it('valida envelope de comando com uuid e payload', () => {
      const cmd = {
        id: sampleUuid1,
        type: 'token.move',
        payload: { tokenId: sampleUuid2, x: 10, y: 20 },
      };

      expect(CommandEnvelope.safeParse(cmd).success).toBe(true);
      expect(Cmd.safeParse(cmd).success).toBe(true);
    });

    it('rejeita comando com id que nao e uuid', () => {
      const invalid = {
        id: 'nao-e-uuid',
        type: 'token.move',
        payload: {},
      };

      expect(CommandEnvelope.safeParse(invalid).success).toBe(false);
    });
  });

  describe('Ack Envelope (ack)', () => {
    it('valida ack de sucesso com versao incrementada', () => {
      const successAck = {
        ok: true,
        version: 42,
      };

      const result = AckEnvelope.safeParse(successAck);
      expect(result.success).toBe(true);
      expect(Ack.safeParse(successAck).success).toBe(true);
    });

    it('valida ack de erro com codigo e mensagem', () => {
      const errorAck = {
        ok: false,
        code: 'FORBIDDEN',
        message: 'Apenas o mestre ou dono pode mover este token.',
      };

      const result = AckEnvelope.safeParse(errorAck);
      expect(result.success).toBe(true);
    });

    it('rejeita ack com codigo de erro inexistente', () => {
      const invalid = {
        ok: false,
        code: 'SOME_RANDOM_CODE',
        message: 'Erro desconhecido',
      };

      expect(AckEnvelope.safeParse(invalid).success).toBe(false);
    });
  });

  describe('Event Envelope (evt)', () => {
    it('valida envelope de evento com version, type, actorId e cmdId opcional', () => {
      const evt = {
        version: 5,
        type: 'token.moved',
        payload: { tokenId: sampleUuid2, x: 150, y: 250 },
        actorId: sampleUuid1,
        cmdId: sampleUuid2,
      };

      const result = EventEnvelope.safeParse(evt);
      expect(result.success).toBe(true);
      expect(Evt.safeParse(evt).success).toBe(true);
    });

    it('aceita envelope de evento sem cmdId', () => {
      const evt = {
        version: 6,
        type: 'round.advanced',
        payload: { round: 2 },
        actorId: sampleUuid1,
      };

      expect(EventEnvelope.safeParse(evt).success).toBe(true);
    });
  });

  describe('Snapshot Envelope (snapshot)', () => {
    it('valida snapshot com version e table valida', () => {
      const snapshot = {
        version: 10,
        table: {
          version: 10,
          activeSceneId: null,
          round: 1,
          turn: 1,
          scenes: {},
        },
      };

      const result = SnapshotEnvelope.safeParse(snapshot);
      expect(result.success).toBe(true);
      expect(Snapshot.safeParse(snapshot).success).toBe(true);
    });
  });

  describe('Comandos dominio.verbo e payloads', () => {
    it('valida todos os tipos de comandos no CommandType', () => {
      const commands = [
        'token.create',
        'token.move',
        'token.update',
        'token.delete',
        'zone.create',
        'zone.update',
        'zone.delete',
        'marker.create',
        'marker.update',
        'marker.delete',
        'background.create',
        'background.update',
        'background.delete',
        'scene.create',
        'scene.update',
        'scene.delete',
        'scene.activate',
        'initiative.update',
        'round.next',
        'turn.next',
        'ping',
      ];

      for (const cmd of commands) {
        expect(CommandType.safeParse(cmd).success).toBe(true);
      }
    });

    it('valida payload de token.move', () => {
      const payload = {
        tokenId: sampleUuid1,
        x: 100,
        y: 200,
      };
      expect(TokenMovePayload.safeParse(payload).success).toBe(true);
    });

    it('valida payload de token.delete', () => {
      const payload = {
        tokenId: sampleUuid1,
      };
      expect(TokenDeletePayload.safeParse(payload).success).toBe(true);
    });

    it('valida payload de scene.activate', () => {
      const payload = {
        sceneId: sampleUuid1,
      };
      expect(SceneActivatePayload.safeParse(payload).success).toBe(true);
    });

    it('valida payload de round.next e turn.next', () => {
      expect(RoundNextPayload.safeParse({ round: 2 }).success).toBe(true);
      expect(RoundNextPayload.safeParse({}).success).toBe(true);
      expect(TurnNextPayload.safeParse({ turn: 3 }).success).toBe(true);
      expect(TurnNextPayload.safeParse({}).success).toBe(true);
    });

    it('valida payload de token.create e token.update', () => {
      const createPayload = {
        token: {
          id: sampleUuid1,
          name: 'Token Novo',
          ownerMemberId: null,
          visibility: 'all',
          imageRef: null,
          x: 0,
          y: 0,
          size: 1,
          hp: 10,
          maxHp: 10,
        },
      };
      expect(TokenCreatePayload.safeParse(createPayload).success).toBe(true);

      const updatePayload = {
        tokenId: sampleUuid1,
        updates: { hp: 5 },
      };
      expect(TokenUpdatePayload.safeParse(updatePayload).success).toBe(true);
    });

    it('valida payloads de zone (create, update, delete)', () => {
      const createPayload = {
        zone: {
          id: sampleUuid1,
          type: 'rect',
          x: 0,
          y: 0,
          w: 50,
          h: 50,
          data: {
            title: 'Sala',
            desc: 'Descricao',
            visits: 0,
          },
        },
      };
      expect(ZoneCreatePayload.safeParse(createPayload).success).toBe(true);

      const updatePayload = {
        zoneId: sampleUuid1,
        updates: { x: 10 },
      };
      expect(ZoneUpdatePayload.safeParse(updatePayload).success).toBe(true);

      const deletePayload = {
        zoneId: sampleUuid1,
      };
      expect(ZoneDeletePayload.safeParse(deletePayload).success).toBe(true);
    });

    it('valida payloads de marker (create, update, delete)', () => {
      const createPayload = {
        marker: {
          id: sampleUuid1,
          x: 10,
          y: 20,
          text: 'Entrada',
        },
      };
      expect(MarkerCreatePayload.safeParse(createPayload).success).toBe(true);

      const updatePayload = {
        markerId: sampleUuid1,
        updates: { text: 'Saida' },
      };
      expect(MarkerUpdatePayload.safeParse(updatePayload).success).toBe(true);

      const deletePayload = {
        markerId: sampleUuid1,
      };
      expect(MarkerDeletePayload.safeParse(deletePayload).success).toBe(true);
    });

    it('valida payloads de background (create, update, delete)', () => {
      const createPayload = {
        background: {
          id: sampleUuid1,
          imageRef: 'bg.webp',
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
        },
      };
      expect(BackgroundCreatePayload.safeParse(createPayload).success).toBe(
        true,
      );

      const updatePayload = {
        backgroundId: sampleUuid1,
        updates: { scale: 1.5 },
      };
      expect(BackgroundUpdatePayload.safeParse(updatePayload).success).toBe(
        true,
      );

      const deletePayload = {
        backgroundId: sampleUuid1,
      };
      expect(BackgroundDeletePayload.safeParse(deletePayload).success).toBe(
        true,
      );
    });

    it('valida payloads de scene (create, update, delete)', () => {
      const createPayload = {
        scene: {
          id: sampleUuid1,
          name: 'Cena 1',
          tokens: {},
          zones: {},
          markers: {},
          backgrounds: {},
          initiative: { order: [], values: {} },
        },
      };
      expect(SceneCreatePayload.safeParse(createPayload).success).toBe(true);

      const updatePayload = {
        sceneId: sampleUuid1,
        updates: { name: 'Cena Modificada' },
      };
      expect(SceneUpdatePayload.safeParse(updatePayload).success).toBe(true);

      const deletePayload = {
        sceneId: sampleUuid1,
      };
      expect(SceneDeletePayload.safeParse(deletePayload).success).toBe(true);
    });

    it('valida payload de initiative.update', () => {
      const payload = {
        initiative: {
          order: [sampleUuid1],
          values: { [sampleUuid1]: 12 },
        },
      };
      expect(InitiativeUpdatePayload.safeParse(payload).success).toBe(true);
    });

    it('valida payload de ping', () => {
      const payload = { x: 50, y: 75 };
      expect(PingPayload.safeParse(payload).success).toBe(true);
    });
  });

  describe('Eventos no participio', () => {
    it('valida todos os eventos no EventType', () => {
      const events = [
        'token.created',
        'token.moved',
        'token.updated',
        'token.deleted',
        'zone.created',
        'zone.updated',
        'zone.deleted',
        'marker.created',
        'marker.updated',
        'marker.deleted',
        'background.created',
        'background.updated',
        'background.deleted',
        'scene.created',
        'scene.updated',
        'scene.deleted',
        'scene.activated',
        'initiative.updated',
        'round.advanced',
        'turn.advanced',
        'pinged',
      ];

      for (const evt of events) {
        expect(EventType.safeParse(evt).success).toBe(true);
      }
    });
  });
});
