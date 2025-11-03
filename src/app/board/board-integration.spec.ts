import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BoardStore } from './board-store';
import { BoardService } from './services/board.service';
import { IssueApiService } from './services/issue-api.service';
import { SprintApiService } from './services/sprint-api.service';
import { BoardApiService } from './services/board-api.service';
import type { Issue } from '../shared/models/issue.model';
import type { Sprint } from './models';
import { Board } from './models/board.model';
import { environment } from '../../environments/environment';

describe('Board Integration Tests', () => {
  let store: BoardStore;
  let boardService: BoardService;
  let issueApiService: IssueApiService;
  let sprintApiService: SprintApiService;
  let boardApiService: BoardApiService;
  let httpMock: HttpTestingController;

  const mockBoard: Board = {
    id: 'board-1',
    name: 'Test Board',
    projectId: 'project-1',
    projectName: 'Test Project',
    type: 'PROJECT',
    source: 'CUSTOM',
    columns: [
      { id: 'TODO', title: 'To Do', color: '#3D62A8', position: 1 },
      { id: 'IN_PROGRESS', title: 'In Progress', color: '#FFA500', position: 2 },
      { id: 'DONE', title: 'Done', color: '#22C55E', position: 3 }
    ],
    includeBacklog: true,
    includeDone: true,
    createdBy: 'user-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
    isDefault: true
  };

  const mockIssues: Issue[] = [
    {
      id: 'ISS-1',
      title: 'Implement login',
      description: 'Add authentication',
      type: 'TASK',
      status: 'TODO',
      priority: 'HIGH',
      assignee: 'John Doe',
      labels: ['backend', 'security'],
      sprintId: 'sprint-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02')
    },
    {
      id: 'ISS-2',
      title: 'Fix navbar bug',
      description: 'Navbar not responsive',
      type: 'BUG',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assignee: 'Jane Smith',
      labels: ['frontend', 'ui'],
      sprintId: 'sprint-1',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04')
    },
    {
      id: 'ISS-3',
      title: 'Update documentation',
      description: 'Add API docs',
      type: 'TASK',
      status: 'DONE',
      priority: 'LOW',
      assignee: 'Bob Johnson',
      labels: ['documentation'],
      sprintId: 'sprint-1',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-06')
    }
  ];

  const mockSprints: Sprint[] = [
    {
      id: 'sprint-1',
      name: 'Sprint 1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-14'),
      status: 'ACTIVE',
      issues: mockIssues
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BoardStore,
        BoardService,
        IssueApiService,
        SprintApiService,
        BoardApiService
      ]
    });

    store = TestBed.inject(BoardStore);
    boardService = TestBed.inject(BoardService);
    issueApiService = TestBed.inject(IssueApiService);
    sprintApiService = TestBed.inject(SprintApiService);
    boardApiService = TestBed.inject(BoardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Board Service Integration', () => {
    it('should load boards from API', (done) => {
      const mockBoards = [mockBoard];

      boardApiService.getBoardsByProject('project-1').subscribe(response => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/Board/project/project-1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockBoards, message: 'Success' });
    });

    it('should handle board API errors gracefully', (done) => {
      boardApiService.getBoardsByProject('project-1').subscribe({
        next: () => {
          fail('Should have errored');
        },
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/Board/project/project-1`);
      req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });
    });
  });

  describe('Issue API Integration', () => {
    it('should load issues for a project', async () => {
      const promise = store.loadIssuesByProject('project-1');

      const req = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockIssues);

      await promise;

      expect(store.issues().length).toBe(3);
      expect(store.issues()[0].title).toBe('Implement login');
    });

    it('should handle empty issues response', async () => {
      const promise = store.loadIssuesByProject('project-1');

      const req = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      req.flush([]);

      await promise;

      expect(store.issues().length).toBe(0);
    });

    it('should handle API errors when loading issues', async () => {
      const promise = store.loadIssuesByProject('project-1');

      const req = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });

      await promise;

      expect(store.issues().length).toBe(0);
    });
  });

  describe('Sprint API Integration', () => {
    it('should load sprints for a project', async () => {
      const promise = store.loadSprintsByProject('project-1');

      const req = httpMock.expectOne(`${environment.apiUrl}/api/Sprint/project/project-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSprints);

      await promise;

      expect(store.sprints().length).toBe(1);
      expect(store.sprints()[0].name).toBe('Sprint 1');
    });

    it('should handle empty sprints response', async () => {
      const promise = store.loadSprintsByProject('project-1');

      const req = httpMock.expectOne(`${environment.apiUrl}/api/Sprint/project/project-1`);
      req.flush([]);

      await promise;

      expect(store.sprints().length).toBe(0);
    });

    it('should handle API errors when loading sprints', async () => {
      const promise = store.loadSprintsByProject('project-1');

      const req = httpMock.expectOne(`${environment.apiUrl}/api/Sprint/project/project-1`);
      req.error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });

      await promise;

      expect(store.sprints().length).toBe(0);
    });
  });

  describe('Board Store Integration with APIs', () => {
    it('should load complete board data (issues + sprints)', async () => {
      const promise = store.loadBoardData('project-1');

      // Expect both API calls
      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      const sprintsReq = httpMock.expectOne(`${environment.apiUrl}/api/Sprint/project/project-1`);

      issuesReq.flush(mockIssues);
      sprintsReq.flush(mockSprints);

      await promise;

      expect(store.issues().length).toBe(3);
      expect(store.sprints().length).toBe(1);
    });

    it('should handle partial API failures gracefully', async () => {
      const promise = store.loadBoardData('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      const sprintsReq = httpMock.expectOne(`${environment.apiUrl}/api/Sprint/project/project-1`);

      // Issues succeed, sprints fail
      issuesReq.flush(mockIssues);
      sprintsReq.error(new ProgressEvent('error'), { status: 500 });

      await promise;

      expect(store.issues().length).toBe(3);
      expect(store.sprints().length).toBe(0);
    });

    it('should filter visible issues by sprint selection', async () => {
      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(mockIssues);

      // Select specific sprint
      store.selectedSprintId.set('sprint-1');
      expect(store.visibleIssues().length).toBe(3);

      // Select backlog
      store.selectedSprintId.set('BACKLOG');
      const backlogIssues = mockIssues.filter(i => !i.sprintId);
      expect(store.visibleIssues().length).toBe(backlogIssues.length);
    });

    it('should apply filters to visible issues', async () => {
      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(mockIssues);

      // Filter by assignee
      store.filters.set({ 
        assignees: ['John Doe'], 
        workTypes: [], 
        labels: [], 
        statuses: [],
        priorities: []
      });

      const visible = store.visibleIssues();
      expect(visible.length).toBe(1);
      expect(visible[0].assignee).toBe('John Doe');
    });

    it('should search across multiple issue fields', async () => {
      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(mockIssues);

      // Search by title
      store.search.set('login');
      expect(store.visibleIssues().length).toBe(1);
      expect(store.visibleIssues()[0].title).toContain('login');

      // Search by description
      store.search.set('navbar');
      expect(store.visibleIssues().length).toBe(1);
      expect(store.visibleIssues()[0].description).toContain('Navbar');
    });

    it('should group issues by status in column buckets', async () => {
      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(mockIssues);

      const buckets = store.columnBuckets();
      
      // Should have buckets for all columns
      expect(buckets.length).toBeGreaterThan(0);
      
      // Find TODO bucket
      const todoBucket = buckets.find(b => b.def.id === 'TODO');
      expect(todoBucket).toBeDefined();
      expect(todoBucket!.items.some(i => i.status === 'TODO')).toBe(true);
    });

    it('should update issue status and sync with store', async () => {
      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(mockIssues);

      const issueId = 'ISS-1';
      const newStatus = 'IN_PROGRESS' as any;

      // Update locally
      store.updateIssueStatus(issueId, newStatus);

      const updatedIssue = store.issues().find(i => i.id === issueId);
      expect(updatedIssue?.status).toBe(newStatus);
    });
  });

  describe('Board Column Management Integration', () => {
    it('should add a new column to the board', () => {
      const initialCount = store.columns().length;
      
      store.addColumn({
        id: 'TESTING' as any,
        title: 'Testing',
        color: '#8B5CF6',
        position: initialCount + 1
      });

      expect(store.columns().length).toBe(initialCount + 1);
      expect(store.columns()[initialCount].title).toBe('Testing');
    });

    it('should remove a column from the board', () => {
      const initialColumns = store.columns();
      const columnToRemove = initialColumns[0].id;

      store.removeColumn(columnToRemove);

      expect(store.columns().length).toBe(initialColumns.length - 1);
      expect(store.columns().find(c => c.id === columnToRemove)).toBeUndefined();
    });

    it('should update column order via columns signal', () => {
      const currentColumns = store.columns();
      const reorderedColumns = [
        { ...currentColumns[2], position: 1 },
        { ...currentColumns[0], position: 2 },
        { ...currentColumns[1], position: 3 }
      ];

      store.columns.set(reorderedColumns);

      expect(store.columns()[0].id).toBe(currentColumns[2].id);
      expect(store.columns()[1].id).toBe(currentColumns[0].id);
    });
  });

  describe('Group By Feature Integration', () => {
    it('should group issues by assignee', async () => {
      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(mockIssues);

      store.groupBy.set('ASSIGNEE');
      const buckets = store.columnBuckets();

      // Should have buckets for each column
      expect(buckets.length).toBeGreaterThan(0);
      // Issues should be grouped
      expect(buckets.some(b => b.items.length > 0)).toBe(true);
    });

    it('should handle no grouping', async () => {
      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(mockIssues);

      store.groupBy.set('NONE');
      const buckets = store.columnBuckets();

      // Each bucket should have items
      const totalItems = buckets.reduce((sum, b) => sum + b.items.length, 0);
      expect(totalItems).toBe(mockIssues.length);
    });

    it('should group issues by epic', async () => {
      const issuesWithEpics = mockIssues.map((issue, idx) => ({
        ...issue,
        epicId: idx % 2 === 0 ? 'EPIC-1' : 'EPIC-2'
      }));

      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(issuesWithEpics);

      store.groupBy.set('EPIC');
      const buckets = store.columnBuckets();

      // Should have buckets
      expect(buckets.length).toBeGreaterThan(0);
    });

    it('should group issues by subtask', async () => {
      const issuesWithParents = mockIssues.map((issue, idx) => ({
        ...issue,
        parentId: idx % 2 === 0 ? 'ISS-PARENT-1' : 'ISS-PARENT-2'
      }));

      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(issuesWithParents);

      store.groupBy.set('SUBTASK');
      const buckets = store.columnBuckets();

      // Should have buckets
      expect(buckets.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Updates Simulation', () => {
    it('should reflect issue updates immediately in visible issues', async () => {
      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(mockIssues);

      const initialCount = store.visibleIssues().length;
      
      // Add new issue to simulate real-time update
      const newIssue: Issue = {
        id: 'ISS-100',
        title: 'Real-time issue',
        description: 'Added via websocket',
        type: 'TASK',
        status: 'TODO',
        priority: 'HIGH',
        assignee: 'Real User',
        labels: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      store['_issues'].update(issues => [...issues, newIssue]);

      expect(store.issues().length).toBe(initialCount + 1);
      expect(store.visibleIssues().some(i => i.id === 'ISS-100')).toBe(true);
    });

    it('should handle concurrent updates to different issues', async () => {
      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(mockIssues);

      // Simulate concurrent status updates
      store.updateIssueStatus('ISS-1', 'IN_PROGRESS' as any);
      store.updateIssueStatus('ISS-2', 'DONE' as any);

      const issue1 = store.issues().find(i => i.id === 'ISS-1');
      const issue2 = store.issues().find(i => i.id === 'ISS-2');

      expect(issue1?.status).toBe('IN_PROGRESS');
      expect(issue2?.status).toBe('DONE');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large number of issues efficiently', async () => {
      const largeIssueSet: Issue[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `ISS-${i}`,
        title: `Issue ${i}`,
        description: `Description ${i}`,
        type: 'TASK',
        status: ['TODO', 'IN_PROGRESS', 'DONE'][i % 3] as any,
        priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3] as any,
        assignee: `User ${i % 10}`,
        labels: [`label-${i % 5}`],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(largeIssueSet);

      expect(store.issues().length).toBe(1000);
      
      // Test filtering performance
      store.search.set('Issue 50');
      const filtered = store.visibleIssues();
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should handle missing or null field values gracefully', async () => {
      const issuesWithNulls: Issue[] = [
        {
          id: 'ISS-NULL',
          title: 'Incomplete issue',
          description: '',
          type: 'TASK',
          status: 'TODO',
          priority: 'MEDIUM',
          assignee: '',
          labels: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(issuesWithNulls);

      expect(store.issues().length).toBe(1);
      expect(store.visibleIssues().length).toBe(1);
      
      const buckets = store.columnBuckets();
      const todoBucket = buckets.find(b => b.def.id === 'TODO');
      expect(todoBucket?.items.length).toBe(1);
    });

    it('should maintain data consistency during rapid filter changes', async () => {
      await store.loadIssuesByProject('project-1');

      const issuesReq = httpMock.expectOne(`${environment.apiUrl}/api/Issue/project/project-1`);
      issuesReq.flush(mockIssues);

      // Rapid filter changes
      store.filters.set({ assignees: ['John Doe'], workTypes: [], labels: [], statuses: [], priorities: [] });
      store.filters.set({ assignees: [], workTypes: ['TASK'], labels: [], statuses: [], priorities: [] });
      store.filters.set({ assignees: [], workTypes: [], labels: ['backend'], statuses: [], priorities: [] });

      const visible = store.visibleIssues();
      expect(visible.every(i => i.labels?.includes('backend'))).toBe(true);
    });
  });
});
