import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Navbar } from '../../../shared/navbar/navbar';
import { SidebarStateService } from '../../../shared/services/sidebar-state.service';
import { BoardColumn } from '../board-column/board-column';
import { BoardStore } from '../../board-store';
import { BoardToolbar } from '../board-toolbar/board-toolbar';
import { BoardColumnsContainer } from '../board-columns-container/board-columns-container';
import { DUMMY_SPRINTS, BACKLOG } from './seed.full';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CommonModule, 
    Sidebar, 
    Navbar, 
    BoardToolbar,
    BoardColumnsContainer
  ],
  templateUrl: './board-page.html',
  styleUrls: ['./board-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardPage implements OnInit {
  private sidebarStateService = inject(SidebarStateService);
  private store = inject(BoardStore);

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  sprints = this.store.sprints;
  columns = this.store.columnBuckets;

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  ngOnInit(): void {
    this.store.loadData(DUMMY_SPRINTS);
    this.store.addBacklog(BACKLOG);
    this.store.selectSprint('active-1');
  }
}
