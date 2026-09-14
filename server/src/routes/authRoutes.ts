import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Todos os campos são obrigatórios.' });
    }

    const result = await AuthService.register(username, email, password);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao registrar usuário.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: 'Informe o usuário/e-mail e a senha.' });
    }

    const result = await AuthService.login(identifier, password);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Credenciais inválidas.' });
  }
});

// POST /api/auth/google
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res
        .status(400)
        .json({ error: 'Token do Google não fornecido.' });
    }

    const result = await AuthService.googleAuth(idToken);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Falha na autenticação com Google.' });
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
  } catch (err: any) {
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
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro interno ao validar sessão.' });
  }
});
