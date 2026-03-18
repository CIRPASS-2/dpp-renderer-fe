import { TestBed } from '@angular/core/testing';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from '../auth.config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let oauthServiceSpy: jasmine.SpyObj<OAuthService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('OAuthService', [
      'configure',
      'loadDiscoveryDocumentAndTryLogin',
      'initCodeFlow',
      'logOut',
      'getAccessToken',
      'hasValidAccessToken',
      'getIdentityClaims'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: OAuthService, useValue: spy }
      ]
    });

    service = TestBed.inject(AuthService);
    oauthServiceSpy = TestBed.inject(OAuthService) as jasmine.SpyObj<OAuthService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialize', () => {
    it('should configure oauth service and load discovery document', async () => {
      oauthServiceSpy.loadDiscoveryDocumentAndTryLogin.and.returnValue(Promise.resolve(true));

      await service.initialize();

      expect(oauthServiceSpy.configure).toHaveBeenCalledWith(authConfig);
      expect(oauthServiceSpy.loadDiscoveryDocumentAndTryLogin).toHaveBeenCalled();
    });

    it('should emit initialized true after successful initialization', async () => {
      oauthServiceSpy.loadDiscoveryDocumentAndTryLogin.and.returnValue(Promise.resolve(true));
      let hasInitialized = false;

      service.waitForInit().subscribe(initialized => {
        hasInitialized = initialized;
      });

      await service.initialize();

      expect(hasInitialized).toBe(true);
    });
  });

  describe('login', () => {
    it('should call initCodeFlow', () => {
      service.login();
      expect(oauthServiceSpy.initCodeFlow).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call logOut', () => {
      service.logout();
      expect(oauthServiceSpy.logOut).toHaveBeenCalled();
    });
  });

  describe('accessToken', () => {
    it('should return access token from oauth service', () => {
      const testToken = 'test-access-token';
      oauthServiceSpy.getAccessToken.and.returnValue(testToken);

      expect(service.accessToken).toBe(testToken);
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when has valid access token', () => {
      oauthServiceSpy.hasValidAccessToken.and.returnValue(true);
      expect(service.isLoggedIn).toBe(true);
    });

    it('should return false when has no valid access token', () => {
      oauthServiceSpy.hasValidAccessToken.and.returnValue(false);
      expect(service.isLoggedIn).toBe(false);
    });
  });

  describe('decodedAccessToken', () => {
    it('should return null when no access token', () => {
      oauthServiceSpy.getAccessToken.and.returnValue('');
      expect(service.decodedAccessToken).toBeNull();
    });

    it('should decode valid JWT token', () => {
      const mockPayload = { sub: '123', name: 'Test User' };
      const encodedPayload = btoa(JSON.stringify(mockPayload));
      const mockToken = `header.${encodedPayload}.signature`;

      oauthServiceSpy.getAccessToken.and.returnValue(mockToken);

      expect(service.decodedAccessToken).toEqual(mockPayload);
    });

    it('should return null for invalid JWT token', () => {
      oauthServiceSpy.getAccessToken.and.returnValue('invalid-token');
      expect(service.decodedAccessToken).toBeNull();
    });

    it('should handle base64 URL encoding with dashes and underscores', () => {
      const mockPayload = { sub: '123', name: 'Test User' };
      const base64Payload = btoa(JSON.stringify(mockPayload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const mockToken = `header.${base64Payload}.signature`;

      oauthServiceSpy.getAccessToken.and.returnValue(mockToken);

      expect(service.decodedAccessToken).toEqual(mockPayload);
    });
  });

  describe('identityClaims', () => {
    it('should return identity claims from oauth service', () => {
      const mockClaims = { sub: '123', email: 'test@example.com' };
      oauthServiceSpy.getIdentityClaims.and.returnValue(mockClaims);

      expect(service.identityClaims).toEqual(mockClaims);
    });
  });
});
