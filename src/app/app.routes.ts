import { Routes } from '@angular/router';
import { BacklogPage } from './backlog/backlog-page/backlog-page';
import { SummaryPage } from './summary/summary-page/summary-page';
import { ReportDashboardHome } from './report-dashboard/report-dashboard-home/report-dashboard-home';
import { BoardPage } from './board/components/board-page/board-page';
import { TimelineComponent } from './timeline/timeline-component/timeline-component';
import { BurnupChart } from './report-dashboard/burnup-chart/burnup-chart';
import { BurndownChart } from './report-dashboard/burndown-chart/burndown-chart';
import { VelocityChart } from './report-dashboard/velocity-chart/velocity-chart';
import { MainDashboardHome } from './main-dashboard/main-dashboard-home/main-dashboard-home';
import { ProjectsPage } from './projects/projects-page/projects-page';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: MainDashboardHome },
  { path: 'projects', component: ProjectsPage },
  { path: 'summary', component: SummaryPage },
  { path: 'backlog', component: BacklogPage },
  { path: 'board', component: BoardPage },
  { path: 'report-dashboard', component: ReportDashboardHome },
  { path: 'timeline', component: TimelineComponent },
  {
    path: 'report-dashboard/burnup-chart',
    component: BurnupChart,
  },
  {
    path: 'report-dashboard/burndown-chart',
    component: BurndownChart,
  },
  {
    path: 'report-dashboard/velocity-chart',
    component: VelocityChart,
  },
];
