import { Issue } from '../models/issue.model';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
import { Epic } from '../models/epic.model';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
// Dashboard interfaces
export interface DashboardProject {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Completed';
  sprint: string;
  tasks: {
    toDo: number;
    inProgress: number;
    done: number;
  };
  teamMembers: string[];
  deadline: string;
  updated: string;
  starred?: boolean;
}

export interface DashboardActivity {
  id: string;
  user: string;
  initials: string;
  action: string;
  task: string;
  taskId: string;
  time: string;
  type: 'completed' | 'commented' | 'assigned';
}

export interface DashboardStats {
  activeProjects: number;
  issuesInProgress: number;
  sprintsInProgress: number;
}

export interface TaskStatus {
  toDo: number;
  inProgress: number;
  completed: number;
  onHold: number;
}

// Available users
export const users: User[] = [
  { id: 'user-1', name: 'Amal A', email: 'amal@example.com' },
  { id: 'user-2', name: 'Kiran Paulson', email: 'kiran@example.com' },
  { id: 'user-3', name: 'Kavya S', email: 'kavya@example.com' },
  { id: 'user-4', name: 'Harrel Alex', email: 'harrelalex@example.com' },
  { id: 'user-5', name: 'Sharath Shony', email: 'sharath@example.com' },
  { id: 'user-6', name: 'Samasya P Promod', email: 'samasya@example.com' },
  { id: 'user-7', name: 'Nadim Naisam', email: 'nadim@example.com' },
  { id: 'user-8', name: 'Unassigned', email: '' },
];

// Completed Sprint 1 issues
// export const completedSprint1Issues: Issue[] = [
//   {
//     id: 'PMT-001',
//     title: 'Setup project structure',
//     description: 'Initialize Angular project with routing and core modules',
//     type: 'TASK',
//     priority: 'HIGH',
//     status: 'DONE',
//     assignee: 'John Doe',
//     storyPoints: 3,
//     sprintId: 'completed-1',
//     epicId: 'epic-1',
//     createdAt: new Date('2025-08-01'),
//     updatedAt: new Date('2025-08-10'),
//   },
//   {
//     id: 'PMT-002',
//     title: 'Design database schema',
//     description: 'Create ERD and database tables for the application',
//     type: 'STORY',
//     priority: 'HIGH',
//     status: 'DONE',
//     assignee: 'Jane Smith',
//     storyPoints: 5,
//     sprintId: 'completed-1',
//     epicId: 'epic-1',
//     updatedAt: new Date('2025-08-14')
//   },
//   {
//     id: 'PMT-003',
//     title: 'Create authentication API',
//     description: 'Build REST API endpoints for user authentication',
//     type: 'STORY',
//     priority: 'CRITICAL',
//     status: 'DONE',
//     assignee: 'Alex Johnson',
//     storyPoints: 8,
//     sprintId: 'completed-1',
//     epicId: 'epic-1',
//     updatedAt: new Date('2025-08-16')
//   },
//   {
//     id: 'PMT-004',
//     title: 'Setup Docker containers',
//     description: 'Configure Docker for development environment',
//     type: 'TASK',
//     priority: 'MEDIUM',
//     status: 'DONE',
//     assignee: 'Mike Brown',
//     storyPoints: 5,
//     sprintId: 'completed-1',
//     epicId: 'epic-1',
//     updatedAt: new Date('2025-08-13')
//   }
// ];
export const completedSprint1Issues: Issue[] = [
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
    teamId: 'team-1', // Frontend Development Team
    epicId: 'epic-1',
    createdAt: new Date('2025-08-01'),
    updatedAt: new Date('2025-08-10'),
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
    teamId: 'team-1', // Frontend Development Team
    epicId: 'epic-1',
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-14'),
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
    teamId: 'team-1', // Frontend Development Team
    epicId: 'epic-1',
    createdAt: new Date('2025-08-03'),
    updatedAt: new Date('2025-08-17'),
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
    teamId: 'team-1', // Frontend Development Team
    epicId: 'epic-1',
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2025-08-13'),
  },
];

// Completed Sprint 2 issues
export const completedSprint2Issues: Issue[] = [
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
    teamId: 'team-4', // QA & Testing Team
    epicId: 'epic-2',
    createdAt: new Date('2025-08-20'),
    updatedAt: new Date('2025-09-01'),
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
    teamId: 'team-4', // QA & Testing Team
    epicId: 'epic-2',
    createdAt: new Date('2025-08-21'),
    updatedAt: new Date('2025-08-30'),
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
    teamId: 'team-4', // QA & Testing Team
    epicId: 'epic-2',
    createdAt: new Date('2025-08-22'),
    updatedAt: new Date('2025-09-02'),
  },
];

// Active Sprint issues
export const activeSprintIssues: Issue[] = [
  {
    id: 'PMT-101',
    title: 'Implement user authentication',
    description: 'Add login and registration functionality with JWT tokens',
    type: 'STORY',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignee: 'John Doe',
    storyPoints: 8,
    sprintId: 'active-1',
    teamId: 'team-1', // Frontend Development Team
    epicId: 'epic-2',
    startDate: new Date('2025-10-01'),
    dueDate: new Date('2025-10-15'),
    endDate: new Date('2025-10-14'),
    createdAt: new Date('2025-09-25'),
    updatedAt: new Date('2025-10-08'),
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
    sprintId: 'active-1',
    teamId: 'team-1', // Frontend Development Team
    epicId: 'epic-2',
    startDate: new Date('2025-10-05'),
    dueDate: new Date('2025-10-12'),
    endDate: new Date('2025-10-11'),
    createdAt: new Date('2025-09-26'),
    updatedAt: new Date('2025-10-07'),
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
    sprintId: 'active-1',
    teamId: 'team-1', // Frontend Development Team
    epicId: 'epic-2',
    startDate: new Date('2025-09-20'),
    dueDate: new Date('2025-10-01'),
    endDate: new Date('2025-09-30'),
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2025-10-06'),
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
    sprintId: 'active-1',
    teamId: 'team-1', // Frontend Development Team
    epicId: 'epic-2',
    startDate: new Date('2025-10-03'),
    dueDate: new Date('2025-10-10'),
    endDate: new Date('2025-10-09'),
    createdAt: new Date('2025-09-27'),
    updatedAt: new Date('2025-10-05'),
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
    sprintId: 'active-1',
    teamId: 'team-1', // Frontend Development Team
    epicId: 'epic-2',
    startDate: new Date('2025-10-08'),
    dueDate: new Date('2025-10-25'),
    endDate: new Date('2025-10-24'),
    createdAt: new Date('2025-09-28'),
    updatedAt: new Date('2025-10-13'),
  }, 
  {
    id: 'PMT-106',
    title: 'Update dependencies',
    description: 'Update all npm packages to latest versions',
    type: 'TASK',
    priority: 'LOW',
    status: 'TODO',
    assignee: 'Emma Wilson',
    storyPoints: 2,
    sprintId: 'active-1',
    teamId: 'team-1', // Frontend Development Team
    epicId: 'epic-2',
    startDate: new Date('2025-10-10'),
    dueDate: new Date('2025-10-12'),
    endDate: new Date('2025-10-12'),
    createdAt: new Date('2025-09-29'),
    updatedAt: new Date('2025-09-29'),
  },
];

// Planned Sprint issues
export const plannedSprintIssues: Issue[] = [
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
    teamId: 'team-2', // Backend API Team
    epicId: 'epic-1',
    startDate: new Date('2025-10-20'),
    dueDate: new Date('2025-11-05'),
    endDate: new Date('2025-11-04'),
    createdAt: new Date('2025-09-28'),
    updatedAt: new Date('2025-09-28'),
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
    teamId: 'team-2', // Backend API Team
    epicId: 'epic-1',
    startDate: new Date('2025-10-22'),
    dueDate: new Date('2025-11-02'),
    endDate: new Date('2025-11-01'),
    createdAt: new Date('2025-09-29'),
    updatedAt: new Date('2025-09-29'),
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
    teamId: 'team-2', // Backend API Team
    epicId: 'epic-1',
    startDate: new Date('2025-10-25'),
    dueDate: new Date('2025-11-10'),
    endDate: new Date('2025-11-08'),
    createdAt: new Date('2025-09-30'),
    updatedAt: new Date('2025-09-30'),
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
    teamId: 'team-2', // Backend API Team
    sprintId: 'planned-1',
    epicId: 'epic-1',
    createdAt: new Date('2025-09-30'),
    updatedAt: new Date('2025-09-30'),
  },
];

// Backlog issues (not assigned to any sprint)
export const backlogIssues: Issue[] = [
  {
    id: 'PMT-201',
    title: 'Implement email notifications',
    description:
      'Send email notifications for important events like task assignments and sprint completions',
    type: 'STORY',
    priority: 'HIGH',
    status: 'TODO',
    assignee: 'Emma Wilson',
    storyPoints: 8,
    teamId: 'team-3', // Mobile Development Team
    epicId: 'epic-1',
    startDate: new Date('2025-11-01'),
    dueDate: new Date('2025-11-15'),
    endDate: new Date('2025-11-14'),
    createdAt: new Date('2025-09-15'),
    updatedAt: new Date('2025-09-15'),
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
    teamId: 'team-3', // Mobile Development Team
    epicId: 'epic-1',
    startDate: new Date('2025-11-05'),
    dueDate: new Date('2025-11-12'),
    endDate: new Date('2025-11-11'),
    createdAt: new Date('2025-09-18'),
    updatedAt: new Date('2025-09-18'),
  },
  {
    id: 'PMT-203',
    title: 'Fix memory leak in chart component',
    description: 'Chart component is causing memory leaks when unmounted',
    type: 'BUG',
    priority: 'CRITICAL',
    status: 'TODO',
    storyPoints: 3,
    teamId: 'team-3', // Mobile Development Team
    epicId: 'epic-2',
    startDate: new Date('2025-10-28'),
    dueDate: new Date('2025-10-30'),
    endDate: new Date('2025-10-30'),
    createdAt: new Date('2025-09-22'),
    updatedAt: new Date('2025-09-22'),
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
    teamId: 'team-3', // Mobile Development Team
    startDate: new Date('2025-11-10'),
    dueDate: new Date('2025-11-20'),
    endDate: new Date('2025-11-19'),
    createdAt: new Date('2025-09-23'),
    updatedAt: new Date('2025-09-23'),
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
    teamId: 'team-3', // Mobile Development Team
    epicId: 'epic-2',
    startDate: new Date('2025-11-15'),
    dueDate: new Date('2025-12-10'),
    endDate: new Date('2025-12-08'),
    createdAt: new Date('2025-09-10'),
    updatedAt: new Date('2025-09-10'),
  },
  {
    id: 'PMT-206',
    title: 'Improve search performance',
    description: 'Optimize search functionality to handle large datasets efficiently',
    type: 'TASK',
    priority: 'HIGH',
    status: 'TODO',
    storyPoints: 5,
    teamId: 'team-3', // Mobile Development Team
    epicId: 'epic-1',
    createdAt: new Date('2025-09-24'),
    updatedAt: new Date('2025-09-24'),
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
    teamId: 'team-3', // Mobile Development Team
    createdAt: new Date('2025-09-19'),
    updatedAt: new Date('2025-09-19'),
  },
  {
    id: 'PMT-208',
    title: 'Setup CI/CD pipeline',
    description: 'Configure automated testing and deployment pipeline',
    type: 'TASK',
    priority: 'HIGH',
    status: 'TODO',
    assignee: 'Noah Garcia',
    teamId: 'team-3', // Mobile Development Team
    storyPoints: 8,
    epicId: 'epic-1',
    createdAt: new Date('2025-09-21'),
    updatedAt: new Date('2025-09-21'),
  },
];

// All sprints
export const sprints: Sprint[] = [
  {
    id: 'completed-1',
    name: 'Sprint 1 - Foundation',
    startDate: new Date('2025-08-01'),
    endDate: new Date('2025-08-15'),
    status: 'COMPLETED',
    issues: completedSprint1Issues,
  },
  {
    id: 'completed-2',
    name: 'Sprint 2 - Authentication',
    startDate: new Date('2025-08-20'),
    endDate: new Date('2025-09-05'),
    status: 'COMPLETED',
    issues: completedSprint2Issues,
  },
  {
    id: 'active-1',
    name: 'Sprint 3 - Core Features',
    startDate: new Date('2025-10-04'),
    endDate: new Date('2025-10-13'),
    status: 'ACTIVE',
    issues: activeSprintIssues,
  },
  {
    id: 'planned-1',
    name: 'Sprint 4 - Advanced Features',
    startDate: new Date('2025-10-18'),
    endDate: new Date('2025-10-31'),
    status: 'PLANNED',
    issues: plannedSprintIssues,
  },
];

// Epic Work Items
export const epic1WorkItems: Issue[] = [
  {
    id: 'SCRUM-3',
    title: 'SCRUM-3',
    description: 'Improve work item functionality',
    type: 'TASK',
    priority: 'MEDIUM',
    status: 'DONE',
    assignee: 'Amal A',
    storyPoints: 8,
    epicId: 'epic-1',
    createdAt: new Date('2025-09-15'),
    updatedAt: new Date('2025-10-01'),
  },
  {
    id: 'SCRUM-5',
    title: 'SCRUM-5',
    description: 'Implement advanced search features',
    type: 'STORY',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assignee: 'Noah Garcia',
    storyPoints: 13,
    epicId: 'epic-1',
    startDate: new Date('2025-09-15'),
    dueDate: new Date('2025-10-20'), // Overdue by 7 days! (today is Oct 27)
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2025-10-02'),
  },
  {
    id: 'SCRUM-9',
    title: 'SCRUM-9',
    description: 'Fix navigation issues',
    type: 'BUG',
    priority: 'HIGH',
    status: 'TODO',
    assignee: 'Unassigned',
    storyPoints: 5,
    epicId: 'epic-1',
    startDate: new Date('2025-10-22'),
    dueDate: new Date('2025-10-31'),
    createdAt: new Date('2025-09-25'),
    updatedAt: new Date('2025-09-25'),
  },
];

export const epic2WorkItems: Issue[] = [
  {
    id: 'SCRUM-7',
    title: 'SCRUM-7',
    description: 'Add dashboard analytics',
    type: 'STORY',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignee: 'John Doe',
    storyPoints: 8,
    epicId: 'epic-2',
    createdAt: new Date('2025-09-28'),
    updatedAt: new Date('2025-10-03'),
  },
  {
    id: 'SCRUM-8',
    title: 'SCRUM-8',
    description: 'Implement user permissions',
    type: 'TASK',
    priority: 'CRITICAL',
    status: 'TODO',
    assignee: 'Jane Smith',
    storyPoints: 5,
    epicId: 'epic-2',
    createdAt: new Date('2025-09-30'),
    updatedAt: new Date('2025-09-30'),
  },
];

// Epics
export const epics: Epic[] = [
  {
    id: 'epic-1',
    name: 'epic 1',
    description: 'Sample description',
    startDate: new Date('2025-10-07'),
    dueDate: new Date('2025-10-23'),
    progress: 60,
    issueCount: 3,
    isExpanded: false,
    assignee: 'Amal A',
    labels: ['internal', 'now'],
    parent: 'None',
    team: 'None',
    sprint: 'SCRUM Sprint 1',
    storyPoints: 40,
    reporter: 'Amal A',
    childWorkItems: ['SCRUM-3', 'SCRUM-5', 'SCRUM-3'],
    status: 'IN_PROGRESS',
  },
  {
    id: 'epic-2',
    name: 'epic 2',
    description: 'Another epic description',
    startDate: new Date('2025-10-07'),
    dueDate: new Date('2025-10-23'),
    progress: 30,
    issueCount: 2,
    isExpanded: false,
    assignee: 'Unassigned',
    labels: [],
    parent: 'None',
    team: 'None',
    sprint: 'None',
    storyPoints: 0,
    reporter: 'Amal A',
    childWorkItems: ['SCRUM-7', 'SCRUM-8'],
    status: 'TODO',
  },
];

// Dashboard data
export const dashboardStats: DashboardStats = {
  activeProjects: 2,
  issuesInProgress: 12,
  sprintsInProgress: 3,
};

export const dashboardTaskStatus: TaskStatus = {
  toDo: 8,
  inProgress: 6,
  completed: 7,
  onHold: 3,
};

export const dashboardProjects: DashboardProject[] = [
  {
    id: '1',
    name: 'Mobile App Revamp',
    type: 'Scrum Project',
    status: 'Active',
    sprint: 'Sprint Alpha',
    tasks: { toDo: 15, inProgress: 8, done: 25 },
    teamMembers: ['A', 'B', 'C', '+2'],
    deadline: 'Oct 5, 2025',
    updated: '2h ago',
    starred: true,
  },
  {
    id: '2',
    name: 'Web Dashboard',
    type: 'Scrum Project',
    status: 'Completed',
    sprint: 'Sprint Beta',
    tasks: { toDo: 8, inProgress: 4, done: 32 },
    teamMembers: ['D', 'E', 'F', '+3'],
    deadline: 'Oct 12, 2025',
    updated: '5h ago',
    starred: false,
  },
];

export const dashboardActivities: DashboardActivity[] = [
  {
    id: '1',
    user: 'You',
    initials: 'SC',
    action: 'completed task',
    task: 'User authentication flow',
    taskId: 'ECOM-123',
    time: '2 minutes ago',
    type: 'completed',
  },
  {
    id: '2',
    user: 'Mike Johnson',
    initials: 'MJ',
    action: 'commented on',
    task: 'Mobile responsive design',
    taskId: 'MAR-45',
    time: '15 minutes ago',
    type: 'commented',
  },
  {
    id: '3',
    user: 'Emily Davis',
    initials: 'ED',
    action: 'assigned you to',
    task: 'Database optimization',
    taskId: 'DAT-78',
    time: '1 hour ago',
    type: 'assigned',
  },
  {
    id: '4',
    user: 'You',
    initials: 'HA',
    action: 'completed task',
    task: 'Process flow',
    taskId: 'ECOM-124',
    time: '2 hours ago',
    type: 'completed',
  },
];
