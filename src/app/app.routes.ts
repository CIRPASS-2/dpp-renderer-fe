import { Routes } from '@angular/router';
import { ComparerStepperComponent } from './comparer/comparer-stepper/comparer-stepper.component';
import { DppViewerComponent } from './renderer/dpp-viewer/dpp-viewer.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'comparison',
        pathMatch: "full"
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
