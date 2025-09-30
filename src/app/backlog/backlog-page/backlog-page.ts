import { Component } from '@angular/core';
import { SprintContainer, Sprint } from '../../sprint/sprint-container/sprint-container';
import { BacklogContainer } from '../backlog-container/backlog-container';
import { Issue } from '../../shared/models/issue.model';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { Filters, FilterCriteria } from '../../shared/filters/filters';

@Component({
  selector: 'app-backlog-page',
  imports: [SprintContainer, BacklogContainer, Sidebar, Navbar, Filters],
  templateUrl: './backlog-page.html',
  styleUrl: './backlog-page.css'
})
export class BacklogPage {
  // Completed Sprint 1 issues
  private completedSprint1Issues: Issue[] = [
    {
      id: 'PMT-001',
      title: 'Setup project structure',
      description: 'Initialize Angular project with routing and core modules',
      type: 'TASK',
      priority: 'HIGH',
      status: 'DONE',
      assignee: 'John Doe',
      storyPoints: 3,
      sprintId: 'completed-1',
      createdAt: new Date('2025-08-01'),
      updatedAt: new Date('2025-08-15')
    },
    {
      id: 'PMT-002',
      title: 'Design database schema',
      description: 'Create ERD and database tables for the application',
      type: 'STORY',
      priority: 'HIGH',
      status: 'DONE',
      assignee: 'Jane Smith',
      storyPoints: 5,
      sprintId: 'completed-1',
      createdAt: new Date('2025-08-02'),
      updatedAt: new Date('2025-08-14')
    },
    {
      id: 'PMT-003',
      title: 'Create authentication API',
      description: 'Build REST API endpoints for user authentication',
      type: 'STORY',
      priority: 'CRITICAL',
      status: 'DONE',
      assignee: 'Alex Johnson',
      storyPoints: 8,
      sprintId: 'completed-1',
      createdAt: new Date('2025-08-03'),
      updatedAt: new Date('2025-08-16')
    },
    {
      id: 'PMT-004',
      title: 'Setup Docker containers',
      description: 'Configure Docker for development environment',
      type: 'TASK',
      priority: 'MEDIUM',
      status: 'DONE',
      assignee: 'Mike Brown',
      storyPoints: 5,
      sprintId: 'completed-1',
      createdAt: new Date('2025-08-05'),
      updatedAt: new Date('2025-08-13')
    }
  ];

  // Completed Sprint 2 issues
  private completedSprint2Issues: Issue[] = [
    {
      id: 'PMT-021',
      title: 'Build login page UI',
      description: 'Create responsive login interface with form validation',
      type: 'STORY',
      priority: 'HIGH',
      status: 'DONE',
      assignee: 'Sarah Lee',
      storyPoints: 5,
      sprintId: 'completed-2',
      createdAt: new Date('2025-08-20'),
      updatedAt: new Date('2025-09-01')
    },
    {
      id: 'PMT-022',
      title: 'Implement JWT token handling',
      description: 'Add token storage and refresh mechanism',
      type: 'TASK',
      priority: 'HIGH',
      status: 'DONE',
      assignee: 'John Doe',
      storyPoints: 3,
      sprintId: 'completed-2',
      createdAt: new Date('2025-08-21'),
      updatedAt: new Date('2025-08-30')
    },
    {
      id: 'PMT-023',
      title: 'Create user dashboard',
      description: 'Build main dashboard with navigation and widgets',
      type: 'STORY',
      priority: 'MEDIUM',
      status: 'DONE',
      assignee: 'Emma Wilson',
      storyPoints: 8,
      sprintId: 'completed-2',
      createdAt: new Date('2025-08-22'),
      updatedAt: new Date('2025-09-02')
    }
  ];

  // Active Sprint issues
  private activeSprintIssues: Issue[] = [
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

  // Planned Sprint issues
  private plannedSprintIssues: Issue[] = [
    {
      id: 'PMT-301',
      title: 'Implement WebSocket real-time updates',
      description: 'Add real-time notifications using WebSockets',
      type: 'STORY',
      priority: 'HIGH',
      status: 'TODO',
      assignee: 'Oliver Davis',
      storyPoints: 13,
      sprintId: 'planned-1',
      createdAt: new Date('2025-09-28'),
      updatedAt: new Date('2025-09-28')
    },
    {
      id: 'PMT-302',
      title: 'Add team collaboration features',
      description: 'Enable team members to comment and collaborate on issues',
      type: 'STORY',
      priority: 'MEDIUM',
      status: 'TODO',
      assignee: 'Sophia Martinez',
      storyPoints: 8,
      sprintId: 'planned-1',
      createdAt: new Date('2025-09-29'),
      updatedAt: new Date('2025-09-29')
    },
    {
      id: 'PMT-303',
      title: 'Create analytics dashboard',
      description: 'Build charts and metrics for project analytics',
      type: 'STORY',
      priority: 'MEDIUM',
      status: 'TODO',
      assignee: 'Liam Anderson',
      storyPoints: 13,
      sprintId: 'planned-1',
      createdAt: new Date('2025-09-30'),
      updatedAt: new Date('2025-09-30')
    },
    {
      id: 'PMT-304',
      title: 'Optimize database queries',
      description: 'Add indexes and optimize slow queries',
      type: 'TASK',
      priority: 'HIGH',
      status: 'TODO',
      assignee: 'Noah Garcia',
      storyPoints: 5,
      sprintId: 'planned-1',
      createdAt: new Date('2025-09-30'),
      updatedAt: new Date('2025-09-30')
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

  // All sprints
  sprints: Sprint[] = [
    {
      id: 'completed-1',
      name: 'Sprint 1 - Foundation',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-08-15'),
      status: 'COMPLETED',
      issues: this.completedSprint1Issues
    },
    {
      id: 'completed-2',
      name: 'Sprint 2 - Authentication',
      startDate: new Date('2025-08-20'),
      endDate: new Date('2025-09-05'),
      status: 'COMPLETED',
      issues: this.completedSprint2Issues
    },
    {
      id: 'active-1',
      name: 'Sprint 3 - Core Features',
      startDate: new Date('2025-10-04'),
      endDate: new Date('2025-10-13'),
      status: 'ACTIVE',
      issues: this.activeSprintIssues
    },
    {
      id: 'planned-1',
      name: 'Sprint 4 - Advanced Features',
      startDate: new Date('2025-10-18'),
      endDate: new Date('2025-10-31'),
      status: 'PLANNED',
      issues: this.plannedSprintIssues
    }
  ];

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
}
