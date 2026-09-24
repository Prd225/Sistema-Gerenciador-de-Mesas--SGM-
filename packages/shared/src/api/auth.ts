import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable(),
  role: z.string(),
  createdAt: z.string(),
});
export const UserProfile = UserProfileSchema;
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const AuthResponseSchema = z.object({
  user: UserProfileSchema,
  token: z.string(),
});
export const AuthResponse = AuthResponseSchema;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const RegisterInputSchema = z.object({
  username: z
    .string()
    .min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Formato de e-mail inválido.'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres.'),
});
export const RegisterInput = RegisterInputSchema;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  identifier: z.string().min(1, 'Informe o usuário ou e-mail.'),
  password: z.string().min(1, 'Informe a senha.'),
});
export const LoginInput = LoginInputSchema;
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const GoogleAuthInputSchema = z.object({
  idToken: z.string().min(1, 'Token do Google não fornecido.'),
});
export const GoogleAuthInput = GoogleAuthInputSchema;
export type GoogleAuthInput = z.infer<typeof GoogleAuthInputSchema>;

