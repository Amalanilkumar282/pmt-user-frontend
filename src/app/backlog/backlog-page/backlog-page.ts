import { Component, inject } from '@angular/core';
import { SprintContainer, Sprint } from '../../sprint/sprint-container/sprint-container';
import { BacklogContainer } from '../backlog-container/backlog-container';
import { Issue } from '../../shared/models/issue.model';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { Filters, FilterCriteria } from '../../shared/filters/filters';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import {
  completedSprint1Issues,
  completedSprint2Issues,
  activeSprintIssues,
  plannedSprintIssues,
  backlogIssues as sharedBacklogIssues,
  sprints as sharedSprints
} from '../../shared/data/dummy-backlog-data';

@Component({
  selector: 'app-backlog-page',
  imports: [SprintContainer, BacklogContainer, Sidebar, Navbar, Filters],
  templateUrl: './backlog-page.html',
  styleUrl: './backlog-page.css'
})
export class BacklogPage {
  private sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;
  // Use shared dummy data from shared/data/dummy-backlog-data.ts
  private completedSprint1Issues: Issue[] = completedSprint1Issues;
  private completedSprint2Issues: Issue[] = completedSprint2Issues;
  private activeSprintIssues: Issue[] = activeSprintIssues;
  private plannedSprintIssues: Issue[] = plannedSprintIssues;

  // Backlog issues (not assigned to any sprint)
  backlogIssues: Issue[] = sharedBacklogIssues;

  // All sprints
  sprints: Sprint[] = sharedSprints;

  // Helper to get sprints by status
  get activeSprints(): Sprint[] {
    return this.sprints.filter(s => s.status === 'ACTIVE');
  }

  get plannedSprints(): Sprint[] {
    return this.sprints.filter(s => s.status === 'PLANNED');
  }

  get completedSprints(): Sprint[] {
    return this.sprints.filter(s => s.status === 'COMPLETED');
  }

  handleCreateSprint(): void {
    console.log('Create new sprint');
    // Modal implementation will be added later
    alert('Create Sprint functionality - Modal will be implemented later');
  }

  handleStart(sprintId: string): void {
    console.log('Start sprint:', sprintId);
    // Add your start logic here
  }

  handleComplete(sprintId: string): void {
    console.log('Complete sprint:', sprintId);
    // Add your completion logic here
  }

  handleEdit(sprintId: string): void {
    console.log('Edit sprint:', sprintId);
    // Modal implementation will be added later
    alert(`Edit Sprint ${sprintId} - Modal will be implemented later`);
  }

  handleDelete(sprintId: string): void {
    console.log('Delete sprint:', sprintId);
    // Add your deletion logic here
    if (confirm(`Are you sure you want to delete this sprint?`)) {
      console.log('Sprint deleted');
    }
  }

  onFiltersChanged(criteria: FilterCriteria): void {
    console.log('Filters changed:', criteria);
    // Implement filter logic here
    // You can filter sprints and backlog issues based on the criteria
    // For now, just logging the criteria
  }

  // Get list of all sprints for move dropdown
  get availableSprintsForMove(): Array<{ id: string, name: string, status: string }> {
    return this.sprints.map(s => ({
      id: s.id,
      name: s.name,
      status: s.status
    }));
  }

  // Get list of all drop list IDs for drag-drop connections
  get allDropListIds(): string[] {
    const sprintIds = this.sprints.map(s => `sprint-${s.id}`);
    return ['backlog-container', ...sprintIds];
  }

  // Get connected drop lists for a specific sprint (all except itself)
  getConnectedDropListsForSprint(sprintId: string): string[] {
    return this.allDropListIds.filter(id => id !== `sprint-${sprintId}`);
  }

  // Get connected drop lists for backlog (all sprints)
  get connectedDropListsForBacklog(): string[] {
    return this.allDropListIds.filter(id => id !== 'backlog-container');
  }

  // Handle moving issue between sprints/backlog
  handleMoveIssue(issueId: string, destinationSprintId: string | null): void {
    console.log(`Moving issue ${issueId} to sprint ${destinationSprintId || 'backlog'}`);
    
    // Find the issue in all sprints and backlog
    let movedIssue: Issue | undefined;
    let sourceSprintId: string | null = null;

    // Search in backlog
    const backlogIndex = this.backlogIssues.findIndex(i => i.id === issueId);
    if (backlogIndex !== -1) {
      movedIssue = this.backlogIssues[backlogIndex];
      this.backlogIssues = this.backlogIssues.filter(i => i.id !== issueId);
    }

    // Search in sprints
    if (!movedIssue) {
      for (const sprint of this.sprints) {
        if (sprint.issues) {
          const issueIndex = sprint.issues.findIndex(i => i.id === issueId);
          if (issueIndex !== -1) {
            movedIssue = sprint.issues[issueIndex];
            sourceSprintId = sprint.id;
            sprint.issues = sprint.issues.filter(i => i.id !== issueId);
            break;
          }
        }
      }
    }

    if (movedIssue) {
      // Update the issue's sprintId
      movedIssue.sprintId = destinationSprintId || undefined;
      movedIssue.updatedAt = new Date();

      // Add to destination
      if (destinationSprintId) {
        const targetSprint = this.sprints.find(s => s.id === destinationSprintId);
        if (targetSprint) {
          if (!targetSprint.issues) {
            targetSprint.issues = [];
          }
          targetSprint.issues.push(movedIssue);
        }
      } else {
        // Move to backlog
        this.backlogIssues.push(movedIssue);
      }

      console.log(`Issue ${issueId} moved successfully`);
    } else {
      console.error(`Issue ${issueId} not found`);
    }
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
}
