export interface User {
  id: string;
  userName: string;
  passwordHash: string;
  email?: string;
  phonNumber?: string;
  createdAt?: Date;
  lastLogin?: Date;
  avatar?: string;
  loginMethods: ('email' | 'phone' | 'username')[];
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
  userAgent?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email?: string;
  phoneNumber?: string;
  username?: string;
  password: string;
}