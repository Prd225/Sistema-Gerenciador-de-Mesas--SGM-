import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool, getDatabaseStatus } from '../db/db';
import type { UserProfile } from '@shared';
import type { UserProfile } from '@sgm/shared';

export type UserDTO = UserProfile;

export class AuthService {
  // Gera token de sessão seguro com 30 dias de validade
  private static async createSession(userId: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    await pool.query(
      `INSERT INTO sessions (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, userId, token, expiresAt],
    );

    return token;
  }

  // Cadastro tradicional (senha criptografada com bcrypt salt 10)
  public static async register(
    username: string,
    email: string,
    password: string,
  ): Promise<{ user: UserDTO; token: string }> {
    if (!getDatabaseStatus()) {
      throw new Error('Banco de dados offline. Tente novamente mais tarde.');
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('O nome de usuário deve ter pelo menos 3 caracteres.');
    }
    if (!cleanEmail.includes('@')) {
      throw new Error('Formato de e-mail inválido.');
    }
    if (!password || password.length < 6) {
      throw new Error('A senha deve conter no mínimo 6 caracteres.');
    }

    // Verifica existência prévia
    const existing = await pool.query(
      `SELECT id FROM users WHERE username = $1 OR email = $2`,
      [cleanUsername, cleanEmail],
    );
    if (existing.rows.length > 0) {
      throw new Error('Nome de usuário ou e-mail já cadastrado.');
    }

    // Gera Hash da senha - NUNCA salva em texto plano
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const insertResult = await pool.query(
      `INSERT INTO users (id, username, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'player')
       RETURNING id, username, email, avatar_url, role, created_at`,
      [userId, cleanUsername, cleanEmail, passwordHash],
    );

    const userRow = insertResult.rows[0];
    const token = await this.createSession(userId);

    return {
      user: {
        id: userRow.id,
        username: userRow.username,
        email: userRow.email,
        avatarUrl: userRow.avatar_url,
        role: userRow.role,
        createdAt: userRow.created_at,
      },
      token,
    };
  }

  // Login tradicional
  public static async login(
    identifier: string,
    password: string,
  ): Promise<{ user: UserDTO; token: string }> {
    if (!getDatabaseStatus()) {
      throw new Error('Banco de dados offline. Tente novamente mais tarde.');
    }

    const cleanIdentifier = identifier.trim();
    const result = await pool.query(
      `SELECT id, username, email, password_hash, avatar_url, role, created_at
       FROM users
       WHERE username = $1 OR email = $2`,
      [cleanIdentifier, cleanIdentifier.toLowerCase()],
    );

    if (result.rows.length === 0) {
      throw new Error('Usuário ou senha incorretos.');
    }

    const userRow = result.rows[0];
    if (!userRow.password_hash) {
      throw new Error(
        'Esta conta foi cadastrada usando o Google. Por favor, entre com o Google.',
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      userRow.password_hash,
    );
    if (!passwordMatches) {
      throw new Error('Usuário ou senha incorretos.');
    }

    const token = await this.createSession(userRow.id);

    return {
      user: {
        id: userRow.id,
        username: userRow.username,
        email: userRow.email,
        avatarUrl: userRow.avatar_url,
        role: userRow.role,
        createdAt: userRow.created_at,
      },
      token,
    };
  }

  // Login com Google OAuth (validação com API oficial do Google via fetch nativo)
  public static async googleAuth(
    idToken: string,
  ): Promise<{ user: UserDTO; token: string }> {
    if (!getDatabaseStatus()) {
      throw new Error('Banco de dados offline. Tente novamente mais tarde.');
    }

    if (!idToken) {
      throw new Error('Token do Google não fornecido.');
    }

    // Validação direta no endpoint seguro da Google
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );

    if (!response.ok) {
      throw new Error('Token de autenticação do Google inválido ou expirado.');
    }

    const payload = (await response.json()) as {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
      email_verified?: string | boolean;
    };

    if (!payload.sub || !payload.email) {
      throw new Error('Dados incompletos retornados pelo Google.');
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const avatarUrl = payload.picture || null;
    let baseUsername = (payload.name || email.split('@')[0])
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 20);
    if (baseUsername.length < 3) baseUsername = `user_${googleId.slice(0, 5)}`;

    // Busca usuário existente por googleId ou email
    const existing = await pool.query(
      `SELECT id, username, email, avatar_url, role, created_at, google_id
       FROM users
       WHERE google_id = $1 OR email = $2`,
      [googleId, email],
    );

    let userId: string;
    let finalUser: UserDTO;

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      userId = row.id;

      // Se entrou por email mas ainda não tinha google_id vinculado, atualiza
      if (!row.google_id) {
        await pool.query(
          `UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3`,
          [googleId, avatarUrl, userId],
        );
      }

      finalUser = {
        id: row.id,
        username: row.username,
        email: row.email,
        avatarUrl: row.avatar_url || avatarUrl,
        role: row.role,
        createdAt: row.created_at,
      };
    } else {
      // Cria nova conta associada ao Google com password_hash = NULL
      userId = crypto.randomUUID();
      const insertResult = await pool.query(
        `INSERT INTO users (id, username, email, password_hash, google_id, avatar_url, role)
         VALUES ($1, $2, $3, NULL, $4, $5, 'player')
         RETURNING id, username, email, avatar_url, role, created_at`,
        [userId, baseUsername, email, googleId, avatarUrl],
      );

      const row = insertResult.rows[0];
      finalUser = {
        id: row.id,
        username: row.username,
        email: row.email,
        avatarUrl: row.avatar_url,
        role: row.role,
        createdAt: row.created_at,
      };
    }

    const token = await this.createSession(userId);
    return { user: finalUser, token };
  }

  // Validação de Sessão
  public static async validateSession(token: string): Promise<UserDTO | null> {
    if (!token || !getDatabaseStatus()) return null;

    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.avatar_url, u.role, u.created_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
      [token],
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      avatarUrl: row.avatar_url,
      role: row.role,
      createdAt: row.created_at,
    };
  }

  // Logout / Revogação de Sessão
  public static async revokeSession(token: string): Promise<boolean> {
    if (!token || !getDatabaseStatus()) return false;
    const result = await pool.query(`DELETE FROM sessions WHERE token = $1`, [
      token,
    ]);
    return (result.rowCount ?? 0) > 0;
  }
}
