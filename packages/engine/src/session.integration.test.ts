import { describe, it, expect } from 'vitest';
import {
  Command,
  ServerEvent,
  TableState,
  type RoomMember,
  type Token,
  type TokenStats,
} from '@sgm/shared';
import { applyCommand, type ApplyResult, type EngineEvent } from './apply';
import { projectEvent, projectFor } from './project';
import { createEmptyScene, createEmptyTable } from './state';

/*
 * Integração shared + engine: cada comando passa pelo mesmo caminho que o
 * servidor vai usar (schema Zod do shared -> applyCommand -> projectEvent e
 * projectFor por membro). Tudo o que sai é validado de novo contra os
 * contratos do shared. Os testes de unidade chamam o engine direto e não
 * pegam desencontros entre schema e engine.
 */

const GM: RoomMember = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Mestre',
  role: 'gm',
  color: 'purple',
};
const PLAYER: RoomMember = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Jogador',
  role: 'player',
  color: 'green',
};
const TV: RoomMember = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'TV',
  role: 'spectator',
  color: 'gray',
};
const MEMBERS = [GM, PLAYER, TV];

const SCENE = '44444444-4444-4444-8444-444444444444';
const HERO = '55555555-5555-4555-8555-555555555555';
const THREAT = '66666666-6666-4666-8666-666666666666';
const ZONE = '77777777-7777-4777-8777-777777777777';
const MARKER = '88888888-8888-4888-8888-888888888888';
const CMD = '99999999-9999-4999-8999-999999999999';
const BARE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const stats = (overrides: Partial<TokenStats> = {}): TokenStats => ({
  type: 'player',
  system: 'san',
  agi: 2,
  for: 1,
  int: 3,
  pre: 1,
  vig: 2,
  def: 12,
  bloq: 0,
  esq: 0,
  pv: 20,
  maxPv: 20,
  pe: 5,
  maxPe: 5,
  san: 15,
  maxSan: 15,
  pd: 0,
  maxPd: 0,
  ...overrides,
});

const token = (overrides: Partial<Token>): Token => ({
  id: HERO,
  name: 'Token',
  ownerMemberId: null,
  visibility: 'all',
  imageRef: null,
  x: 0,
  y: 0,
  size: 1,
  conditions: [],
  ...overrides,
});

type Rejection = { ok: false; code: string };

function createRoom() {
  let table = createEmptyTable();
  const inbox = new Map<string, EngineEvent[]>(MEMBERS.map((m) => [m.id, []]));

  function send(actor: RoomMember, raw: unknown): ApplyResult | Rejection {
    const parsed = Command.safeParse(raw);
    if (!parsed.success) return { ok: false, code: 'INVALID_PAYLOAD' };

    const result = applyCommand(table, parsed.data, actor);
    if (!result.ok) return result;
    table = result.table;

    // A mesa do servidor e a de cada membro seguem válidas no contrato.
    TableState.parse(table);
    for (const member of MEMBERS) {
      TableState.parse(projectFor(table, member));
    }

    for (const event of result.events) {
      for (const member of MEMBERS) {
        const projected = projectEvent(event, table, member);
        if (!projected) continue;
        ServerEvent.parse({
          version: table.version,
          type: projected.type,
          payload: projected.payload,
          actorId: actor.id,
          cmdId: CMD,
        });
        inbox.get(member.id)!.push(projected);
      }
    }
    return result;
  }

  return {
    send,
    view: (member: RoomMember) => projectFor(table, member),
    received: (member: RoomMember) => inbox.get(member.id)!,
    clearInbox: () => inbox.forEach((events) => events.splice(0)),
    get table() {
      return table;
    },
  };
}

/** Sala com uma cena ativa, o herói do jogador e uma ameaça escondida. */
function setupRoom() {
  const room = createRoom();
  const ok = (r: ApplyResult | Rejection) => expect(r.ok).toBe(true);

  ok(
    room.send(GM, {
      type: 'scene.create',
      payload: { scene: createEmptyScene(SCENE, 'Cripta') },
    }),
  );
  ok(room.send(GM, { type: 'scene.activate', payload: { sceneId: SCENE } }));
  ok(
    room.send(GM, {
      type: 'token.create',
      payload: {
        token: token({
          id: HERO,
          name: 'Herói',
          ownerMemberId: PLAYER.id,
          stats: stats(),
        }),
      },
    }),
  );
  ok(
    room.send(GM, {
      type: 'token.create',
      payload: {
        token: token({
          id: THREAT,
          name: 'Zumbi',
          visibility: 'gm',
          x: 5,
          y: 5,
          stats: stats({ type: 'threat', pv: 40, maxPv: 40 }),
        }),
      },
    }),
  );
  room.clearInbox();
  return room;
}

const tokensOf = (t: TableState) => t.scenes[SCENE]?.tokens ?? {};

describe('sessão de jogo (shared + engine)', () => {
  it('versão sobe um por comando aceito e não sobe com ping', () => {
    const room = setupRoom();
    const before = room.table.version;

    room.send(GM, { type: 'round.next', payload: {} });
    room.send(GM, { type: 'turn.next', payload: {} });
    expect(room.table.version).toBe(before + 2);

    room.send(TV, { type: 'ping', payload: { x: 1, y: 1 } });
    expect(room.table.version).toBe(before + 2);
  });

  it('jogador move o próprio token e o evento chega para todos', () => {
    const room = setupRoom();
    const result = room.send(PLAYER, {
      type: 'token.move',
      payload: { tokenId: HERO, x: 3, y: 4 },
    });

    expect(result.ok).toBe(true);
    for (const member of MEMBERS) {
      expect(room.received(member).map((e) => e.type)).toEqual(['token.moved']);
      expect(tokensOf(room.view(member))[HERO]).toMatchObject({ x: 3, y: 4 });
    }
  });

  it('jogador recolhe o próprio token para a reserva (x e y nulos)', () => {
    const room = setupRoom();
    const result = room.send(PLAYER, {
      type: 'token.move',
      payload: { tokenId: HERO, x: null, y: null },
    });

    expect(result.ok).toBe(true);
    expect(tokensOf(room.table)[HERO]).toMatchObject({ x: null, y: null });
  });

  it('jogador altera só a própria vida e o resto da ficha fica intacto', () => {
    const room = setupRoom();
    const result = room.send(PLAYER, {
      type: 'token.update',
      payload: { tokenId: HERO, updates: { stats: { pv: 12 } } },
    });

    expect(result.ok).toBe(true);
    expect(tokensOf(room.table)[HERO]?.stats).toEqual(stats({ pv: 12 }));
  });

  it('jogador não altera outros campos da ficha nem o nome', () => {
    const room = setupRoom();
    const version = room.table.version;

    const maxPv = room.send(PLAYER, {
      type: 'token.update',
      payload: { tokenId: HERO, updates: { stats: { maxPv: 99 } } },
    });
    const name = room.send(PLAYER, {
      type: 'token.update',
      payload: { tokenId: HERO, updates: { name: 'Outro' } },
    });

    expect(maxPv).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(name).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(room.table.version).toBe(version);
  });

  it('ficha parcial em token sem ficha é rejeitada, sem corromper a mesa', () => {
    const room = setupRoom();
    const bare = token({ id: BARE, name: 'Sem ficha' });
    room.send(GM, { type: 'token.create', payload: { token: bare } });

    const result = room.send(GM, {
      type: 'token.update',
      payload: { tokenId: BARE, updates: { stats: { pv: 5 } } },
    });

    expect(result).toMatchObject({ ok: false, code: 'INVALID_PAYLOAD' });
    expect(tokensOf(room.table)[BARE]?.stats).toBeUndefined();
  });

  it('payload fora do schema é barrado antes do engine', () => {
    const room = setupRoom();
    const version = room.table.version;

    expect(
      room.send(GM, { type: 'token.move', payload: { tokenId: HERO } }),
    ).toMatchObject({ ok: false, code: 'INVALID_PAYLOAD' });
    expect(
      room.send(GM, { type: 'token.teleport', payload: {} }),
    ).toMatchObject({ ok: false, code: 'INVALID_PAYLOAD' });
    expect(room.table.version).toBe(version);
  });

  it('ameaça escondida não chega ao jogador nem à TV até ser revelada', () => {
    const room = setupRoom();

    expect(tokensOf(room.view(GM))[THREAT]).toBeDefined();
    expect(tokensOf(room.view(PLAYER))[THREAT]).toBeUndefined();
    expect(tokensOf(room.view(TV))[THREAT]).toBeUndefined();

    // Mestre mexe na ameaça escondida: ninguém além dele recebe o evento.
    room.send(GM, {
      type: 'token.update',
      payload: { tokenId: THREAT, updates: { stats: { pv: 30 } } },
    });
    expect(room.received(PLAYER)).toEqual([]);
    expect(room.received(TV)).toEqual([]);

    // Revelar chega como token.created, sem a ficha da ameaça.
    room.send(GM, {
      type: 'token.update',
      payload: { tokenId: THREAT, updates: { visibility: 'all' } },
    });
    for (const member of [PLAYER, TV]) {
      const [event] = room.received(member);
      expect(event?.type).toBe('token.created');
      expect(JSON.stringify(event?.payload)).not.toContain('"stats"');

      const seen = tokensOf(room.view(member))[THREAT];
      expect(seen).toMatchObject({ name: 'Zumbi', x: 5, y: 5 });
      expect(seen?.stats).toBeUndefined();
    }
  });

  it('ficha da ameaça revelada nunca vaza em atualizações', () => {
    const room = setupRoom();
    room.send(GM, {
      type: 'token.update',
      payload: { tokenId: THREAT, updates: { visibility: 'all' } },
    });
    room.clearInbox();

    room.send(GM, {
      type: 'token.update',
      payload: { tokenId: THREAT, updates: { stats: { pv: 10 } } },
    });

    expect(JSON.stringify(room.received(PLAYER))).not.toContain('"pv"');
    expect(JSON.stringify(room.received(GM))).toContain('"pv"');
  });

  it('item de zona não revelado não aparece para o jogador', () => {
    const room = setupRoom();
    room.send(GM, {
      type: 'zone.create',
      payload: {
        zone: {
          id: ZONE,
          type: 'rect',
          x: 0,
          y: 0,
          w: 10,
          h: 10,
          data: {
            title: 'Sala',
            desc: '',
            visits: 0,
            customPois: [
              {
                title: 'Pistas',
                options: [
                  { name: 'Porta', desc: 'Aberta', isRevealed: true },
                  { name: 'Alçapão', desc: 'Secreto', isRevealed: false },
                ],
              },
            ],
          },
        },
      },
    });

    const playerView = JSON.stringify(room.view(PLAYER));
    const playerEvents = JSON.stringify(room.received(PLAYER));
    expect(playerView).toContain('Porta');
    expect(playerView).not.toContain('Alçapão');
    expect(playerEvents).not.toContain('Alçapão');
    expect(JSON.stringify(room.view(GM))).toContain('Alçapão');
  });

  it('marcador oculto só aparece para o jogador quando revelado', () => {
    const room = setupRoom();
    room.send(GM, {
      type: 'marker.create',
      payload: {
        marker: { id: MARKER, x: 1, y: 1, text: 'Tesouro', hidden: true },
      },
    });
    expect(room.received(PLAYER)).toEqual([]);
    expect(room.view(PLAYER).scenes[SCENE]?.markers[MARKER]).toBeUndefined();

    room.send(GM, {
      type: 'marker.update',
      payload: { markerId: MARKER, updates: { hidden: false } },
    });
    expect(room.received(PLAYER).map((e) => e.type)).toEqual([
      'marker.created',
    ]);
    expect(room.view(PLAYER).scenes[SCENE]?.markers[MARKER]).toBeDefined();
  });

  it('TV só envia ping e jogador não executa comandos de mestre', () => {
    const room = setupRoom();
    const version = room.table.version;

    expect(
      room.send(TV, {
        type: 'token.move',
        payload: { tokenId: HERO, x: 9, y: 9 },
      }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(
      room.send(PLAYER, { type: 'round.next', payload: {} }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(
      room.send(PLAYER, { type: 'token.delete', payload: { tokenId: HERO } }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(room.send(TV, { type: 'ping', payload: { x: 0, y: 0 } }).ok).toBe(
      true,
    );
    expect(room.table.version).toBe(version);
  });
});
