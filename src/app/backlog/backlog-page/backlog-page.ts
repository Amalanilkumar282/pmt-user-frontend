import { Component } from '@angular/core';
import { SprintContainer, Sprint } from '../../sprint/sprint-container/sprint-container';
import { BacklogContainer } from '../backlog-container/backlog-container';
import { Issue } from '../../shared/models/issue.model';

@Component({
  selector: 'app-backlog-page',
  imports: [SprintContainer, BacklogContainer],
  templateUrl: './backlog-page.html',
  styleUrl: './backlog-page.css'
})
export class BacklogPage {
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

  // Backlog issues (not assigned to any sprint)
  backlogIssues: Issue[] = [
    {
      id: 'PMT-201',
      title: 'Implement email notifications',
      description: 'Send email notifications for important events like task assignments and sprint completions',
      type: 'STORY',
      priority: 'HIGH',
      status: 'TODO',
      assignee: 'Emma Wilson',
      storyPoints: 8,
      createdAt: new Date('2025-09-15'),
      updatedAt: new Date('2025-09-15')
    },
    {
      id: 'PMT-202',
      title: 'Create user profile page',
      description: 'Design and implement a user profile page with edit capabilities',
      type: 'STORY',
      priority: 'MEDIUM',
      status: 'TODO',
      assignee: 'Oliver Davis',
      storyPoints: 5,
      createdAt: new Date('2025-09-18'),
      updatedAt: new Date('2025-09-18')
    },
    {
      id: 'PMT-203',
      title: 'Fix memory leak in chart component',
      description: 'Chart component is causing memory leaks when unmounted',
      type: 'BUG',
      priority: 'CRITICAL',
      status: 'TODO',
      storyPoints: 3,
      createdAt: new Date('2025-09-22'),
      updatedAt: new Date('2025-09-22')
    },
    {
      id: 'PMT-204',
      title: 'Add export to PDF functionality',
      description: 'Allow users to export reports and sprint summaries to PDF format',
      type: 'TASK',
      priority: 'MEDIUM',
      status: 'TODO',
      assignee: 'Sophia Martinez',
      storyPoints: 8,
      createdAt: new Date('2025-09-23'),
      updatedAt: new Date('2025-09-23')
    },
    {
      id: 'PMT-205',
      title: 'Integrate with Slack',
      description: 'Add Slack integration for team notifications and updates',
      type: 'EPIC',
      priority: 'LOW',
      status: 'TODO',
      assignee: 'Liam Anderson',
      storyPoints: 21,
      createdAt: new Date('2025-09-10'),
      updatedAt: new Date('2025-09-10')
    },
    {
      id: 'PMT-206',
      title: 'Improve search performance',
      description: 'Optimize search functionality to handle large datasets efficiently',
      type: 'TASK',
      priority: 'HIGH',
      status: 'TODO',
      storyPoints: 5,
      createdAt: new Date('2025-09-24'),
      updatedAt: new Date('2025-09-24')
    },
    {
      id: 'PMT-207',
      title: 'Add file attachment support',
      description: 'Allow users to attach files to issues and comments',
      type: 'STORY',
      priority: 'MEDIUM',
      status: 'TODO',
      assignee: 'Ava Thompson',
      storyPoints: 13,
      createdAt: new Date('2025-09-19'),
      updatedAt: new Date('2025-09-19')
    },
    {
      id: 'PMT-208',
      title: 'Setup CI/CD pipeline',
      description: 'Configure automated testing and deployment pipeline',
      type: 'TASK',
      priority: 'HIGH',
      status: 'TODO',
      assignee: 'Noah Garcia',
      storyPoints: 8,
      createdAt: new Date('2025-09-21'),
      updatedAt: new Date('2025-09-21')
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
