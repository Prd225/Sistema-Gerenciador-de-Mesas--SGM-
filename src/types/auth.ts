export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}
