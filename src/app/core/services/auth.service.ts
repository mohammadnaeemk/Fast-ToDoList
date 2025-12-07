import { computed, Injectable, signal } from '@angular/core';
import { Session, User } from '../../shared/models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}
  private _user = signal<User | null>(null);
  private _session = signal<Session | null>(null);

  readonly user = this._user.asReadonly();
  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
}
