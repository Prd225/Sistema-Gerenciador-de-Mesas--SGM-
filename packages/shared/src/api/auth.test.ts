import { describe, it, expect } from 'vitest';
import {
  RegisterInput,
  LoginInput,
  GoogleAuthInput,
  UserProfile,
  AuthResponse,
} from './auth';

describe('Auth API Schemas', () => {
  describe('RegisterInput', () => {
    it('valida payload de cadastro correto', () => {
      const input = {
        username: 'investigador_pedro',
        email: 'pedro@exemplo.com',
        password: 'senhaSegura123',
      };

      const result = RegisterInput.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejeita usuario com menos de 3 caracteres', () => {
      const invalid = {
        username: 'ab',
        email: 'ab@exemplo.com',
        password: 'senhaSegura123',
      };

      expect(RegisterInput.safeParse(invalid).success).toBe(false);
    });

    it('rejeita email em formato incorreto', () => {
      const invalid = {
        username: 'investigador',
        email: 'email-invalido',
        password: 'senhaSegura123',
      };

      expect(RegisterInput.safeParse(invalid).success).toBe(false);
    });

    it('rejeita senha com menos de 6 caracteres', () => {
      const invalid = {
        username: 'investigador',
        email: 'investigador@exemplo.com',
        password: '123',
      };

      expect(RegisterInput.safeParse(invalid).success).toBe(false);
    });
  });

  describe('LoginInput', () => {
    it('valida login com usuario e senha', () => {
      const input = {
        identifier: 'pedro@exemplo.com',
        password: 'senhaSegura123',
      };

      expect(LoginInput.safeParse(input).success).toBe(true);
    });

    it('rejeita login com identificador vazio', () => {
      const invalid = {
        identifier: '',
        password: 'senhaSegura123',
      };

      expect(LoginInput.safeParse(invalid).success).toBe(false);
    });
  });

  describe('GoogleAuthInput', () => {
    it('valida token do google', () => {
      const input = {
        idToken: 'jwt-token-google-123456',
      };

      expect(GoogleAuthInput.safeParse(input).success).toBe(true);
    });

    it('rejeita token vazio', () => {
      expect(GoogleAuthInput.safeParse({ idToken: '' }).success).toBe(false);
    });
  });

  describe('UserProfile & AuthResponse', () => {
    it('valida perfil e resposta de autenticacao', () => {
      const user = {
        id: 'usr-123',
        username: 'pedro',
        email: 'pedro@exemplo.com',
        avatarUrl: null,
        role: 'user',
        createdAt: '2026-09-24T20:00:00.000Z',
      };

      expect(UserProfile.safeParse(user).success).toBe(true);

      const response = {
        user,
        token: 'auth-jwt-token-abcdef',
      };

      expect(AuthResponse.safeParse(response).success).toBe(true);
    });
  });
});
