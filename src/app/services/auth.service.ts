import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthUser {
  id?: number | string;
  email?: string;
  role?: string;
  fullName?: string;
  nickname?: string;
  name?: string;
  userCategory?: string;
}

export interface LoginResponse {
  message?: string;
  accessToken?: string;
  access_token?: string;
  token?: string;
  user?: RawAuthUser;
  data?: {
    accessToken?: string;
    access_token?: string;
    token?: string;
    user?: RawAuthUser;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    fullName: string;
    nickname: string;
    email: string;
    role: string;
    userCategory: string;
    isActive: boolean;
  };
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

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  get user$(): Observable<AuthUser | null> {
    return this.currentUser$.asObservable();
  }

  get currentUser(): AuthUser | null {
    return this.currentUser$.value;
  }

  get isGuest(): boolean {
    return this.currentUser$.value?.role === 'invitado';
  }

  getDefaultRouteForUser(user: AuthUser | null = this.currentUser): string {
    const role = this.normalizeRole(user?.role);

    if (role === 'GUARDIA') {
      return '/dashboard-guardia';
    }

    return '/dashboard-usuario';
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
    this.router.navigate([this.getDefaultRouteForUser(user)]);
  }

  loginAsGuest(): void {
    const guest: AuthUser = {
      id: 'guest',
      role: 'invitado',
      fullName: 'Invitado',
      nickname: 'Invitado'
    };
    this.setSession(guest, '');
    this.router.navigate(['/']);
  }

  login(payload: LoginPayload): Observable<AuthUser> {
    const url = `${this.getApiBase()}/auth/login`;
    return this.http.post<LoginResponse>(url, payload).pipe(
      map((response) => {
        const user = this.normalizeUser(response.user ?? response.data?.user, payload.email);
        this.setSession(user, this.extractToken(response));
        return user;
      })
    );
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    const url = `${this.getApiBase()}/auth/register`;
    return this.http.post<RegisterResponse>(url, payload);
  }

  logout(): void {
    this.clearSession();
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  getToken(): string | null {
    return (
      localStorage.getItem(this.TOKEN_KEY) ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')
    );
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser$.value ?? this.loadUser();
  }

  getUserRole(): string | null {
    return this.normalizeRole(this.getCurrentUser()?.role);
  }

  redirectByRole(): void {
    this.router.navigate([this.getDefaultRouteForUser(this.getCurrentUser())]);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private extractToken(response: LoginResponse): string {
    return (
      response.accessToken ??
      response.access_token ??
      response.token ??
      response.data?.accessToken ??
      response.data?.access_token ??
      response.data?.token ??
      ''
    );
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

  private getApiBase(): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    return base.includes('/api/v1') ? base : `${base}/api/v1`;
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private normalizeRole(role?: string): string | null {
    const normalizedRole = role?.trim().toUpperCase();
    return normalizedRole || null;
  }
}
