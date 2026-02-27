import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import {provideOAuthClient} from 'angular-oauth2-oidc'
import { authInterceptor } from './auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [providePrimeNG({
    theme: {
      preset: Aura
    }
  }), provideAnimations(), provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideHttpClient(withInterceptors([authInterceptor])), provideOAuthClient(), {
    provide: MessageService
  }]
};
