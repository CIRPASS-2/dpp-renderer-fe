import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../environments/environment';

export const authConfig: AuthConfig = {
    issuer: environment.oidcIssuer,
    redirectUri: window.location.origin + '/callback',
    clientId: environment.oidcClientId,
    requireHttps: false,
    responseType: 'code',
    scope: 'openid profile email',
    useSilentRefresh: false,
    showDebugInformation: true,
    strictDiscoveryDocumentValidation: false,
    clearHashAfterLogin: false,
};