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

import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './common/auth.service';
import { CallbackComponent } from './common/callback/callback.component';
import { ComparerStepperComponent } from './comparer/comparer-stepper/comparer-stepper.component';
import { LoginComponent } from './login/login.component';
import { DppViewerComponent } from './renderer/dpp-viewer/dpp-viewer.component';
import { SearchResultsComponent } from './search/search-results/search-results.component';
import { ValidatorResourceViewComponent } from './validator/validator-resource-view/validator-resource-view.component';
import { ValidatorResourcesTableComponent } from './validator/validator-resources-table/validator-resources-table.component';

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
    },
    {
        path: 'validator/:resType',
        component: ValidatorResourcesTableComponent,
        canActivate: [authGuard]
    },
    {
        path: 'validator/:resType/view/:id',
        component: ValidatorResourceViewComponent,
        canActivate: [authGuard]
    }
];
