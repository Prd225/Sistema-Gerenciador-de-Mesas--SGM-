import { z } from 'zod';

export const UserProfile = z.object({
  id: z.string().max(100),
  username: z.string().min(1).max(100),
  email: z.string().email().max(255),
  avatarUrl: z.string().max(1000).nullable(),
  role: z.string().max(50),
  createdAt: z.string().max(50),
});
export type UserProfile = z.infer<typeof UserProfile>;

export const AuthResponse = z.object({
  user: UserProfile,
  token: z.string().max(4096),
});
export type AuthResponse = z.infer<typeof AuthResponse>;

export const RegisterInput = z.object({
  username: z
    .string()
    .min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.')
    .max(50),
  email: z.string().email('Formato de e-mail inválido.').max(255),
  password: z
    .string()
    .min(6, 'A senha deve conter no mínimo 6 caracteres.')
    .max(128),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  identifier: z.string().min(1, 'Informe o usuário ou e-mail.').max(255),
  password: z.string().min(1, 'Informe a senha.').max(128),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const GoogleAuthInput = z.object({
  idToken: z.string().min(1, 'Token do Google não fornecido.').max(4096),
});
export type GoogleAuthInput = z.infer<typeof GoogleAuthInput>;
