export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export type User = UserProfile;

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface GoogleAuthInput {
  idToken: string;
}
