import { Routes } from '@angular/router';
import { BacklogPage } from './backlog/backlog-page/backlog-page';
import { SummaryPage } from './summary/summary-page/summary-page';
import { ReportDashboardHome } from './report-dashboard/report-dashboard-home/report-dashboard-home';
import { TimelineComponent } from './timeline/timeline-component/timeline-component';

export const routes: Routes = [
  { path: '', redirectTo: '/summary', pathMatch: 'full' },
  { path: 'summary', component: SummaryPage },
  { path: 'backlog', component: BacklogPage },
  {path:'report-dashboard',component:ReportDashboardHome},
  {path:'timeline',component:TimelineComponent}
];
