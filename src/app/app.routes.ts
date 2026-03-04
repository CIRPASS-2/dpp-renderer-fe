import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './common/auth.service';
import { CallbackComponent } from './common/callback/callback.component';
import { ComparerStepperComponent } from './comparer/comparer-stepper/comparer-stepper.component';
import { LoginComponent } from './login/login.component';
import { DppViewerComponent } from './renderer/dpp-viewer/dpp-viewer.component';
import { SearchResultsComponent } from './search/search-results/search-results.component';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.waitForInit().pipe(
        filter(initialized => initialized),
        map(() => {
            if (authService.isLoggedIn) {
                return true;
            }
            router.navigate(['login']);
            return false;
        })
    );
};

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: "full"
    },
    {
        path: 'callback',
        component: CallbackComponent
    },
    {
        path: 'login',
        component: LoginComponent,
    },
    {
        path: 'search',
        component: SearchResultsComponent,
        canActivate: [authGuard]

    },
    {
        path: 'comparison',
        component: ComparerStepperComponent,
        canActivate: [authGuard]
    },
    {
        path: 'view',
        component: DppViewerComponent,
        canActivate: [authGuard]
    }
];
