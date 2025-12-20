import { Injectable } from '@angular/core';
import { TokenPayload } from '../../shared/models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor() {}
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  generateToken(userId: string, email?: string, userName?: string, phoneNumber?: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      userName,
      phoneNumber,
      iat: Math.floor(Date.now() / 1000), // زمان حال به ثانیه
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // ۷ روز
    };

    // ساخت توکن ساده (base64)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const signature = btoa('todo_app_secret_signature');

    return `${header}.${payloadEncoded}.${signature}`;
  }

  validateToken(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload) return false;

      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payloadEncoded = parts[1];
      const payloadJson = atob(payloadEncoded);
      return JSON.parse(payloadJson);
    } catch {
      return null;
    }
  }

  saveToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token ? this.validateToken(token) : false;
  }

  getUserFromToken(): TokenPayload | null {
    const token = this.getToken();
    return token ? this.decodeToken(token) : null;
  }
}
