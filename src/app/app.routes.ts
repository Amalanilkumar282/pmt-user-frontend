import { Routes } from '@angular/router';

export const routes: Routes = [

    {
        path: 'report-dashboard', loadChildren: () =>
            import('./report-dashboard/report-dashboard-module').then(m => m.ReportDashboardModule)
    },
];
