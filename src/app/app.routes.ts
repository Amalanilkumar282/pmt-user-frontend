import { Routes } from '@angular/router';
import { BacklogPage } from './backlog/backlog-page/backlog-page';

export const routes: Routes = [
  { path: '', redirectTo: '/backlog', pathMatch: 'full' },
  { path: 'backlog', component: BacklogPage }
];
