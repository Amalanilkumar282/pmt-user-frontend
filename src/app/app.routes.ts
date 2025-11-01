import { Routes } from '@angular/router';
import { BacklogPage } from './backlog/backlog-page/backlog-page';
import { SummaryPage } from './summary/summary-page/summary-page';
import { ReportDashboardHome } from './report-dashboard/report-dashboard-home/report-dashboard-home';
import { BoardPage } from './board/components/board-page/board-page';
import { MessagePage } from './message/message-page/message-page';
import { TimelineComponent } from './timeline/timeline-component/timeline-component';
import { BurnupChart } from './report-dashboard/burnup-chart/burnup-chart';
import { BurndownChart } from './report-dashboard/burndown-chart/burndown-chart';
import { VelocityChart } from './report-dashboard/velocity-chart/velocity-chart';
import { MainDashboardHome } from './main-dashboard/main-dashboard-home/main-dashboard-home';
import { ProjectsPage } from './projects/projects-page/projects-page';
import { TeamsPage } from './teams/teams-page/teams-page';
import { LoginComponent } from './auth/login/login';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: MainDashboardHome },
  { path: 'projects', component: ProjectsPage },
  {
    path: 'projects/:projectId',
    children: [
      { path: '', redirectTo: 'board', pathMatch: 'full' },
      { path: 'board', component: BoardPage },
      { path: 'backlog', component: BacklogPage },
      { path: 'summary', component: SummaryPage },
      { path: 'messages', component: MessagePage },
      { path: 'timeline', component: TimelineComponent },
      { path: 'report-dashboard', component: ReportDashboardHome },
      { path: 'report-dashboard/burnup-chart', component: BurnupChart },
      { path: 'report-dashboard/burndown-chart', component: BurndownChart },
      { path: 'report-dashboard/velocity-chart', component: VelocityChart },
      { path: 'teams', component: TeamsPage },
    ],
  },
];
