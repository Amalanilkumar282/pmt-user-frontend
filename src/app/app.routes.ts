import { Routes } from '@angular/router';
import { BacklogPage } from './backlog/backlog-page/backlog-page';
import { SummaryPage } from './summary/summary-page/summary-page';

export const routes: Routes = [
  { path: '', redirectTo: '/summary', pathMatch: 'full' },
  { path: 'summary', component: SummaryPage },
  { path: 'backlog', component: BacklogPage }
];
