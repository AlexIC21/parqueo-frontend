import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export type UserRole = 'usuario' | 'docente' | 'administrador' | 'invitado';

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'mp_token';
  private readonly USER_KEY = 'mp_user';

  private currentUser$ = new BehaviorSubject<AuthUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  get user$(): Observable<AuthUser | null> {
    return this.currentUser$.asObservable();
  }

  get currentUser(): AuthUser | null {
    return this.currentUser$.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser$.value;
  }

  login(payload: LoginPayload): Observable<AuthUser> {
    return this.http.post<AuthUser>('/api/auth/login', payload).pipe(
      tap(user => this.setSession(user))
    );
  }

  loginAsGuest(): void {
    const guest: AuthUser = {
      id: 'guest',
      email: '',
      nombre: 'Invitado',
      role: 'invitado',
      token: ''
    };
    this.setSession(guest);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  private setSession(user: AuthUser): void {
    localStorage.setItem(this.TOKEN_KEY, user.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser$.next(user);
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
