import { Sprint } from '../../models';
import { Issue } from '../../models';

// Dummy sprint data
export const DUMMY_SPRINTS: Sprint[] = [
  {
    id: 'completed-1',
    name: 'Sprint 1 - Foundation',
    startDate: new Date('2025-08-01'),
    endDate: new Date('2025-08-15'),
    status: 'COMPLETED',
    issues: []
  },
  {
    id: 'completed-2',
    name: 'Sprint 2 - Authentication',
    startDate: new Date('2025-08-20'),
    endDate: new Date('2025-09-05'),
    status: 'COMPLETED',
    issues: []
  },
  {
    id: 'active-1',
    name: 'Sprint 3 - Core Features',
    startDate: new Date('2025-10-04'),
    endDate: new Date('2025-10-13'),
    status: 'ACTIVE',
    issues: []
  },
  {
    id: 'planned-1',
    name: 'Sprint 4 - Advanced Features',
    startDate: new Date('2025-10-18'),
    endDate: new Date('2025-10-31'),
    status: 'PLANNED',
    issues: []
  }
];

// Dummy issues for backlog
export const BACKLOG: Issue[] = [
  {
    id: 'PMT-004',
    title: 'Fix integration test failures',
    description: 'CI pipeline is blocked due to failing integration tests',
    type: 'BUG',
    priority: 'CRITICAL',
    status: 'BLOCKED',
    assignee: 'Alice Chen',
    storyPoints: 8,
    sprintId: 'active-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'i1',
    title: 'Design login page',
    description: 'Create login page with email/password and forgot password flow',
    type: 'TASK',
    priority: 'HIGH',
    status: 'TODO',
    assignee: 'Alice',
    storyPoints: 3,
    sprintId: 'active-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'i2',
    title: 'Fix payment bug',
    description: 'Payment gateway fails on Safari',
    type: 'BUG',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    assignee: 'Bob',
    storyPoints: 5,
    sprintId: 'active-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
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
