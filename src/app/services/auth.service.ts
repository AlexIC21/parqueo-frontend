import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id?: number | string;
  email?: string;
  role?: string;
  fullName?: string;
  nickname?: string;
  userCategory?: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  user?: AuthUser;
}

export type RawAuthUser = AuthUser & {
  nombre?: string;
  apodo?: string;
  name?: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'mp_token';
  private readonly USER_KEY = 'mp_user';

  private currentUser$ = new BehaviorSubject<AuthUser | null>(this.loadUser());

  constructor(private router: Router) {}

  get user$(): Observable<AuthUser | null> {
    return this.currentUser$.asObservable();
  }

  get currentUser(): AuthUser | null {
    return this.currentUser$.value;
  }

  get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get isGuest(): boolean {
    return this.currentUser$.value?.role === 'invitado';
  }

  loginStatic(email: string): void {
    const nickname = email.split('@')[0] || 'Usuario';
    const user: AuthUser = {
      id: 'static-user',
      email,
      role: 'usuario',
      fullName: nickname,
      nickname
    };
    this.setSession(user, 'static-token');
    this.router.navigate(['/dashboard-usuario']);
  }

  loginAsGuest(): void {
    const guest: AuthUser = {
      id: 'guest',
      role: 'invitado',
      fullName: 'Invitado',
      nickname: 'Invitado'
    };
    this.setSession(guest, '');
    this.router.navigate(['/dashboard-usuario']);
  }

  login(payload: LoginPayload): Observable<AuthUser> {
    const nickname = payload.email.split('@')[0] || 'Usuario';
    const user: AuthUser = {
      id: 'static-user',
      email: payload.email,
      role: 'usuario',
      fullName: nickname,
      nickname
    };
    this.setSession(user, 'static-token');
    return new BehaviorSubject(user).asObservable();
  }

  logout(): void {
    this.clearSession();
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string {
    return localStorage.getItem(this.TOKEN_KEY) ?? '';
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setSession(user: AuthUser, token: string): void {
    this.setToken(token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser$.next(user);
  }

  normalizeUser(rawUser?: RawAuthUser, fallbackEmail = ''): AuthUser {
    const email = rawUser?.email ?? fallbackEmail;
    const fullName = rawUser?.fullName ?? rawUser?.name ?? rawUser?.nombre;
    const nickname = rawUser?.nickname ?? rawUser?.apodo;

    return {
      id: rawUser?.id,
      email,
      role: rawUser?.role ?? rawUser?.userCategory,
      fullName,
      nickname,
      userCategory: rawUser?.userCategory
    };
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
