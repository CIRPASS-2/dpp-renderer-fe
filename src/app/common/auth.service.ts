/*
 * Copyright 2024-2027 CIRPASS-2
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { authConfig } from '../auth.config';

/**
 * Service responsible for handling OAuth2 authentication using the Code Flow.
 * Manages user login, logout, token validation and authentication state.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private initialized$ = new BehaviorSubject<boolean>(false);

  constructor(private oauthService: OAuthService) { }

  /**
   * Initializes the OAuth service with configuration and attempts silent login.
   * Must be called before using other authentication methods.
   */
  async initialize(): Promise<void> {
    this.oauthService.configure(authConfig);
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
    this.initialized$.next(true);
  }

  waitForInit() {
    return this.initialized$.asObservable();
  }

  /**
   * Initiates the OAuth2 authorization code flow for user authentication.
   */
  login(): void {
    this.oauthService.initCodeFlow();
  }

  /**
   * Logs out the current user and clears authentication tokens.
   */
  logout(): void {
    this.oauthService.logOut();
  }

  get accessToken(): string {
    return this.oauthService.getAccessToken();
  }

  get isLoggedIn(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  get decodedAccessToken(): Record<string, unknown> | null {
    const token = this.accessToken;
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Returns the set of internal roles for the current user, resolved by applying
   * the configured {@code rolesMappings} against the claim named {@code rolesClaimName}
   * in the access token.
   *
   * The mapping string format is {@code externalRole:INTERNAL_ROLE} pairs separated by commas,
   * e.g. {@code "admin:admin,eo:eo,eu:eu"}.
   * One external role can map to multiple internal roles by repeating the external key,
   * e.g. {@code "admin:admin,admin:eo"}.
   */
  get roles(): Set<string> {
    const token = this.decodedAccessToken;
    if (!token) return new Set();

    const claimPath = (environment.rolesClaimName ?? 'realm_access.roles').split('.');
    let raw: unknown = token;
    for (const segment of claimPath) {
      raw = (raw as Record<string, unknown>)?.[segment];
    }
    const externalRoles: string[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];

    const mappingStr: string = environment.rolesMappings ?? '';
    const mappingEntries = mappingStr
      .split(',')
      .map(entry => entry.trim())
      .filter(entry => entry.includes(':'))
      .map(entry => { const [k, v] = entry.split(':'); return { from: k.trim(), to: v.trim() }; });

    const internalRoles = new Set<string>();
    for (const externalRole of externalRoles) {
      for (const mapping of mappingEntries) {
        if (mapping.from === externalRole) {
          internalRoles.add(mapping.to);
        }
      }
      // pass through if no mapping defined for this role
      if (!mappingEntries.some(m => m.from === externalRole)) {
        internalRoles.add(externalRole);
      }
    }
    return internalRoles;
  }

  /** Returns {@code true} if the current user has the given internal role. */
  hasAnyRole(...roles: string[]): boolean {
    return roles.some(role => this.roles.has(role));
  }

  get identityClaims(): Record<string, unknown> {
    return this.oauthService.getIdentityClaims() as Record<string, unknown>;
  }
}
