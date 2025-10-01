import { Routes } from '@angular/router';
import { BacklogPage } from './backlog/backlog-page/backlog-page';
import { SummaryPage } from './summary/summary-page/summary-page';
import { ReportDashboardHome } from './report-dashboard/report-dashboard-home/report-dashboard-home';
import { BoardPage } from './board/board-page/board-page';

export const routes: Routes = [
  { path: '', redirectTo: '/summary', pathMatch: 'full' },
  { path: 'summary', component: SummaryPage },
  { path: 'backlog', component: BacklogPage },
  { path: 'board', component: BoardPage },
  {path:'report-dashboard',component:ReportDashboardHome}
];
