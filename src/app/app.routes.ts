import { Routes } from '@angular/router';
import { ComparerStepperComponent } from './comparer/comparer-stepper/comparer-stepper.component';
import { DppViewerComponent } from './renderer/dpp-viewer/dpp-viewer.component';
import { SearchResultsComponent } from './search/search-results/search-results.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: "full"
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'search',
        component: SearchResultsComponent
    },
    {
        path: 'comparison',
        component: ComparerStepperComponent
    },
    {
        path: 'view',
        component: DppViewerComponent
    }
];
