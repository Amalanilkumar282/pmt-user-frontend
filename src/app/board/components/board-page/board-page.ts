import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Navbar } from '../../../shared/navbar/navbar';
import { SidebarStateService } from '../../../shared/services/sidebar-state.service';
import { BoardColumn } from '../board-column/board-column';
import { BoardStore } from '../../board-store';
import { BoardToolbar } from '../board-toolbar/board-toolbar';
import { BoardColumnsContainer } from '../board-columns-container/board-columns-container';
import { IssueDetailedView } from '../../../backlog/issue-detailed-view/issue-detailed-view';
import { signal } from '@angular/core';
// import { DUMMY_SPRINTS, BACKLOG } from './seed.full';
import { sprints, completedSprint1Issues, completedSprint2Issues, activeSprintIssues, backlogIssues } from '../../../shared/data/dummy-backlog-data';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CommonModule, 
    Sidebar, 
    Navbar, 
    BoardToolbar,
    BoardColumnsContainer,
    IssueDetailedView
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
  // modal state for issue detailed view
  protected selectedIssue = signal(null as any);
  protected isModalOpen = signal(false);

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  ngOnInit(): void {
    this.store.loadData(sprints);
    this.store.addBacklog(backlogIssues);
    this.store.selectSprint('active-1');
  }

  // open issue detailed view from task card
  onOpenIssue(issue: any) {
    this.selectedIssue.set(issue);
    this.isModalOpen.set(true);
  }

  // public handler for moveIssue emitted by issue-detailed-view
  onMoveIssue(event: { issueId: string, destinationSprintId: string | null }) {
    this.store.updateIssueStatus(event.issueId, 'TODO' as any);
  }
}
