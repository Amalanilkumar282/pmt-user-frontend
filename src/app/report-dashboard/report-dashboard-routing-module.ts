import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportDashboardHome } from './report-dashboard-home/report-dashboard-home';

const routes: Routes = [
  { path: '', component: ReportDashboardHome }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportDashboardRoutingModule { }
