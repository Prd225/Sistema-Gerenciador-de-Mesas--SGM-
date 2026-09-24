import { describe, it, expect } from 'vitest';
import {
  // Game
  ElementTypeSchema,
  DamageTypeSchema,
  ActionTypeSchema,
  TokenStatsSchema,
  ConditionSchema,
  TokenSchema,
  ZoneSchema,
  MarkerSchema,
  InitiativeItemSchema,
  BgImageSchema,
  ActiveToolSchema,
  // Multiplayer
  UserRoleSchema,
  RoomMemberSchema,
  RoomPingSchema,
  SyncStatePayloadSchema,
  RoomStateSchema,
  TokenMovePayloadSchema,
  TokenUpdatePayloadSchema,
  // Auth
  UserProfileSchema,
  AuthResponseSchema,
  RegisterInputSchema,
  LoginInputSchema,
  GoogleAuthInputSchema,
} from '@sgm/shared';

describe('Contracts — Schemas Zod de Game', () => {
  it('valida tipos de elemento e dano permitidos', () => {
    expect(ElementTypeSchema.safeParse('Sangue').success).toBe(true);
    expect(ElementTypeSchema.safeParse('Invalido').success).toBe(false);

    expect(DamageTypeSchema.safeParse('Balístico').success).toBe(true);
    expect(DamageTypeSchema.safeParse('Mental').success).toBe(true);
    expect(DamageTypeSchema.safeParse('Inexistente').success).toBe(false);

    expect(ActionTypeSchema.safeParse('Padrão').success).toBe(true);
    expect(ActionTypeSchema.safeParse('Desconhecida').success).toBe(false);
  });

  it('valida token stats e estruturas de token', () => {
    const validStats = {
      type: 'player' as const,
      system: 'san' as const,
      agi: 2,
      for: 3,
      int: 1,
      pre: 2,
      vig: 2,
      def: 12,
      bloq: 15,
      esq: '2d20+5',
      pv: 20,
      maxPv: 20,
      pe: 10,
      maxPe: 10,
      san: 30,
      maxSan: 30,
      pd: 0,
      maxPd: 0,
    };

    expect(TokenStatsSchema.safeParse(validStats).success).toBe(true);

    const validToken = {
      id: 'token-123',
      name: 'Arthur',
      fullName: 'Arthur Cervero',
      colorText: '#ffffff',
      colorBorder: '#8257e5',
      colorFill: '#121214',
      x: 100,
      y: 200,
      desc: 'Investigador experiente',
      conditions: [
        {
          name: 'Abalado',
          desc: 'Penalidade em testes',
          color: '#e55757',
          type: 'stat_modifier' as const,
          durationTurns: 2,
        },
      ],
      stats: validStats,
    };

    const tokenResult = TokenSchema.safeParse(validToken);
    expect(tokenResult.success).toBe(true);

    const invalidToken = {
      ...validToken,
      stats: { ...validStats, pv: 'invalid' },
    };
    expect(TokenSchema.safeParse(invalidToken).success).toBe(false);
  });

  it('valida condicoes com duracao e tipos de condicao', () => {
    const condition = {
      name: 'Atordoado',
      desc: 'Pula turno',
      color: '#ffd700',
      type: 'skip_turn' as const,
      durationTurns: 1,
    };
    expect(ConditionSchema.safeParse(condition).success).toBe(true);

    const invalidCondition = {
      name: 'Invalido',
      desc: 'Sem cor',
    };
    expect(ConditionSchema.safeParse(invalidCondition).success).toBe(false);
  });

  it('valida schemas de zonas, marcadores e imagens de fundo', () => {
    const validMarker = {
      id: 'marker-1',
      x: 50,
      y: 75,
      text: 'Armadilha',
      iconType: 'pin' as const,
      completed: false,
    };
    expect(MarkerSchema.safeParse(validMarker).success).toBe(true);

    const validBgImage = {
      id: 'bg-1',
      src: 'https://example.com/map.jpg',
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    };
    expect(BgImageSchema.safeParse(validBgImage).success).toBe(true);

    const validZone = {
      id: 'zone-1',
      type: 'rect' as const,
      x: 0,
      y: 0,
      w: 200,
      h: 150,
      data: {
        title: 'Floresta Sombria',
        desc: 'Uma mata densa e perigosa',
        visits: 1,
        customPois: [],
        customEvents: [],
      },
    };
    expect(ZoneSchema.safeParse(validZone).success).toBe(true);

    expect(ActiveToolSchema.safeParse('select').success).toBe(true);
    expect(ActiveToolSchema.safeParse('ferramenta-invalida').success).toBe(
      false,
    );
  });

  it('valida initiative items', () => {
    const item = {
      tokenId: 'token-abc',
      value: 18,
    };
    expect(InitiativeItemSchema.safeParse(item).success).toBe(true);
    expect(
      InitiativeItemSchema.safeParse({ tokenId: 'token-abc' }).success,
    ).toBe(false);
  });
});

describe('Contracts — Schemas Zod de Multiplayer', () => {
  it('valida papeis de usuario e membros de sala', () => {
    expect(UserRoleSchema.safeParse('gm').success).toBe(true);
    expect(UserRoleSchema.safeParse('player').success).toBe(true);
    expect(UserRoleSchema.safeParse('admin').success).toBe(false);

    const member = {
      id: 'socket-1',
      name: 'Ronald',
      role: 'gm' as const,
      color: '#8257e5',
      isOnline: true,
    };
    expect(RoomMemberSchema.safeParse(member).success).toBe(true);
  });

  it('valida payloads de sincronizacao e estado completo da sala', () => {
    const roomState = {
      code: 'SGM-ABCD',
      hostId: 'socket-1',
      members: [
        {
          id: 'socket-1',
          name: 'Ronald',
          role: 'gm' as const,
          color: '#8257e5',
          isOnline: true,
        },
      ],
      tokens: [],
      initiativeQueue: [],
      bgImages: [],
      zones: {},
      markers: {},
      round: 1,
      turn: 1,
    };

    expect(RoomStateSchema.safeParse(roomState).success).toBe(true);

    const syncPayload = {
      tokens: [],
      initiativeQueue: [],
      bgImages: [],
      zones: {},
      markers: {},
      round: 2,
      turn: 3,
    };
    expect(SyncStatePayloadSchema.safeParse(syncPayload).success).toBe(true);
  });

  it('valida ping tatico e atualizacoes de token', () => {
    const ping = {
      id: 'ping-1',
      x: 150,
      y: 300,
      senderName: 'Mestre',
      color: '#ff0000',
      createdAt: Date.now(),
    };
    expect(RoomPingSchema.safeParse(ping).success).toBe(true);

    const movePayload = {
      tokenId: 'token-1',
      x: 250,
      y: null,
    };
    expect(TokenMovePayloadSchema.safeParse(movePayload).success).toBe(true);

    const updatePayload = {
      tokenId: 'token-1',
      updates: { name: 'Novo Nome' },
    };
    expect(TokenUpdatePayloadSchema.safeParse(updatePayload).success).toBe(
      true,
    );
  });
});

describe('Contracts — Schemas Zod de Autenticacao', () => {
  it('valida dados de cadastro com regras de negocio', () => {
    const valid = RegisterInputSchema.safeParse({
      username: 'usuario123',
      email: 'usuario@exemplo.com',
      password: 'senhaSegura123',
    });
    expect(valid.success).toBe(true);

    const tooShort = RegisterInputSchema.safeParse({
      username: 'us',
      email: 'usuario@exemplo.com',
      password: '123',
    });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      expect(tooShort.error.issues.length).toBeGreaterThanOrEqual(2);
    }

    const invalidEmail = RegisterInputSchema.safeParse({
      username: 'usuario123',
      email: 'not-an-email',
      password: 'senhaValida123',
    });
    expect(invalidEmail.success).toBe(false);
  });

  it('valida dados de login e google oauth', () => {
    expect(
      LoginInputSchema.safeParse({
        identifier: 'usuario',
        password: 'minhaSenha',
      }).success,
    ).toBe(true);

    expect(
      LoginInputSchema.safeParse({
        identifier: '',
        password: '',
      }).success,
    ).toBe(false);

    expect(
      GoogleAuthInputSchema.safeParse({ idToken: 'token-jwt-google' }).success,
    ).toBe(true);

    expect(GoogleAuthInputSchema.safeParse({ idToken: '' }).success).toBe(
      false,
    );
  });

  it('valida perfil de usuario e resposta de autenticacao', () => {
    const profile = {
      id: 'uuid-1',
      username: 'mestre',
      email: 'mestre@sgm.com',
      avatarUrl: null,
      role: 'gm',
      createdAt: new Date().toISOString(),
    };
    expect(UserProfileSchema.safeParse(profile).success).toBe(true);

    const authResponse = {
      user: profile,
      token: 'jwt-session-token',
    };
    expect(AuthResponseSchema.safeParse(authResponse).success).toBe(true);
  });
});
