import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SprintContainer, Sprint } from './sprint/sprint-container/sprint-container';
import { Issue } from './shared/models/issue.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SprintContainer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('pmt-user-frontend');

  // Dummy issues data
  private dummyIssues: Issue[] = [
    {
      id: 'PMT-101',
      title: 'Implement user authentication',
      description: 'Add login and registration functionality with JWT tokens',
      type: 'STORY',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignee: 'John Doe',
      storyPoints: 8,
      sprintId: '1',
      createdAt: new Date('2025-09-25'),
      updatedAt: new Date('2025-09-28')
    },
    {
      id: 'PMT-102',
      title: 'Fix dashboard loading issue',
      description: 'Dashboard takes too long to load on slower connections',
      type: 'BUG',
      priority: 'CRITICAL',
      status: 'TODO',
      assignee: 'Jane Smith',
      storyPoints: 5,
      sprintId: '1',
      createdAt: new Date('2025-09-26'),
      updatedAt: new Date('2025-09-26')
    },
    {
      id: 'PMT-103',
      title: 'Design sprint planning UI',
      description: 'Create mockups and wireframes for the sprint planning interface',
      type: 'TASK',
      priority: 'MEDIUM',
      status: 'DONE',
      assignee: 'Alex Johnson',
      storyPoints: 3,
      sprintId: '1',
      createdAt: new Date('2025-09-20'),
      updatedAt: new Date('2025-09-24')
    },
    {
      id: 'PMT-104',
      title: 'API rate limiting',
      description: 'Implement rate limiting to prevent API abuse',
      type: 'TASK',
      priority: 'HIGH',
      status: 'IN_REVIEW',
      assignee: 'Sarah Lee',
      storyPoints: 5,
      sprintId: '1',
      createdAt: new Date('2025-09-27'),
      updatedAt: new Date('2025-09-29')
    },
    {
      id: 'PMT-105',
      title: 'Add dark mode support',
      description: 'Implement theme switcher and dark mode styles',
      type: 'STORY',
      priority: 'LOW',
      status: 'TODO',
      assignee: 'Mike Brown',
      storyPoints: 13,
      sprintId: '1',
      createdAt: new Date('2025-09-28'),
      updatedAt: new Date('2025-09-28')
    },
    {
      id: 'PMT-106',
      title: 'Update dependencies',
      description: 'Update all npm packages to latest versions',
      type: 'TASK',
      priority: 'LOW',
      status: 'TODO',
      storyPoints: 2,
      sprintId: '1',
      createdAt: new Date('2025-09-29'),
      updatedAt: new Date('2025-09-29')
    }
  ];

  // Sample sprint data with issues
  testSprint: Sprint = {
    id: '1',
    name: 'new sprint3',
    startDate: new Date('2025-10-04'),
    endDate: new Date('2025-10-13'),
    status: 'ACTIVE',
    issues: this.dummyIssues
  };

  handleComplete(sprintId: string): void {
    console.log('Complete sprint:', sprintId);
    // Add your completion logic here
  }

  handleDelete(sprintId: string): void {
    console.log('Delete sprint:', sprintId);
    // Add your deletion logic here
  }
}
