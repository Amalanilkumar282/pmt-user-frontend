import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent)
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./main-dashboard/main-dashboard-home/main-dashboard-home').then(m => m.MainDashboardHome)
  },
  { 
    path: 'projects', 
    loadComponent: () => import('./projects/projects-page/projects-page').then(m => m.ProjectsPage)
  },
  {
    path: 'projects/:projectId',
    children: [
      { path: '', redirectTo: 'board', pathMatch: 'full' },
      { 
        path: 'board', 
        loadComponent: () => import('./board/components/board-page/board-page').then(m => m.BoardPage)
      },
      { 
        path: 'backlog', 
        loadComponent: () => import('./backlog/backlog-page/backlog-page').then(m => m.BacklogPage)
      },
      { 
        path: 'summary', 
        loadComponent: () => import('./summary/summary-page/summary-page').then(m => m.SummaryPage)
      },
      { 
        path: 'messages', 
        loadComponent: () => import('./message/message-page/message-page').then(m => m.MessagePage)
      },
      { 
        path: 'timeline', 
        loadComponent: () => import('./timeline/timeline-component/timeline-component').then(m => m.TimelineComponent)
      },
      { 
        path: 'report-dashboard', 
        loadComponent: () => import('./report-dashboard/report-dashboard-home/report-dashboard-home').then(m => m.ReportDashboardHome)
      },
      { 
        path: 'report-dashboard/burnup-chart', 
        loadComponent: () => import('./report-dashboard/burnup-chart/burnup-chart').then(m => m.BurnupChart)
      },
      { 
        path: 'report-dashboard/burndown-chart', 
        loadComponent: () => import('./report-dashboard/burndown-chart/burndown-chart').then(m => m.BurndownChart)
      },
      { 
        path: 'report-dashboard/velocity-chart', 
        loadComponent: () => import('./report-dashboard/velocity-chart/velocity-chart').then(m => m.VelocityChart)
      },
      { 
        path: 'teams', 
        loadComponent: () => import('./teams/teams-page/teams-page').then(m => m.TeamsPage)
      },
    ],
  },
];
