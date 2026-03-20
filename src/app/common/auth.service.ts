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

  get identityClaims(): Record<string, unknown> {
    return this.oauthService.getIdentityClaims() as Record<string, unknown>;
  }
}
