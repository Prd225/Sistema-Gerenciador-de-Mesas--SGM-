import { Router, type Request, type Response } from 'express';
import { AuthService } from '../services/authService';
import {
  RegisterInputSchema,
  LoginInputSchema,
  GoogleAuthInputSchema,
} from '@shared';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Dados de cadastro inválidos.',
    });
  }

  try {
    const { username, email, password } = parsed.data;
    const result = await AuthService.register(username, email, password);
    return res.status(201).json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Erro ao registrar usuário.';
    return res.status(400).json({ error: message });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Dados de login inválidos.',
    });
  }

  try {
    const { identifier, password } = parsed.data;
    const result = await AuthService.login(identifier, password);
    return res.status(200).json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Credenciais inválidas.';
    return res.status(401).json({ error: message });
  }
});

// POST /api/auth/google
authRouter.post('/google', async (req: Request, res: Response) => {
  const parsed = GoogleAuthInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error:
        parsed.error.issues[0]?.message || 'Token do Google não fornecido.',
    });
  }

  try {
    const { idToken } = parsed.data;
    const result = await AuthService.googleAuth(idToken);
    return res.status(200).json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Falha na autenticação com Google.';
    return res.status(410).json({ error: message });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (token) {
      await AuthService.revokeSession(token);
    }
    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Erro ao deslogar.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const user = await AuthService.validateSession(token);
    if (!user) {
      return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
    }

    return res.status(200).json({ user });
  } catch {
    return res.status(500).json({ error: 'Erro interno ao validar sessão.' });
  }
});
