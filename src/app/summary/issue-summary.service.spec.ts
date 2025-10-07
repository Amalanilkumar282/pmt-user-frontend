import { TestBed } from '@angular/core/testing';
import { IssueSummaryService } from './issue-summary.service';
import { Issue } from '../shared/models/issue.model';
import { Sprint } from '../sprint/sprint-container/sprint-container';

// --- Mock Data Setup ---
// The Issue and Sprint models expect Date objects, NOT ISO strings.
// sprintId and assignee are optional strings, so they must be undefined (or a string), not null.

const mockIssue: Issue = {
  id: 'PROJ-1',
  title: 'Test Story',
  type: 'STORY',
  status: 'TODO',
  priority: 'HIGH',
  assignee: 'John Doe',
  sprintId: 'sprint-1-active',
  // FIX: Date objects assigned directly
  createdAt: new Date(new Date().setDate(new Date().getDate() - 10)), // 10 days ago
  updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)), // 1 day ago
  description: 'Test description',
  // FIX: Removed dueDate as it caused TS errors
};

const mockCompletedIssue: Issue = {
  ...mockIssue,
  id: 'PROJ-2',
  status: 'DONE',
  // FIX: Date objects assigned directly
  createdAt: new Date(new Date().setDate(new Date().getDate() - 8)), // 8 days ago
  updatedAt: new Date(new Date().setDate(new Date().getDate() - 3)), // 3 days ago (completed within 7 days)
  sprintId: 'sprint-1-active',
};

const mockOldCompletedIssue: Issue = {
  ...mockIssue,
  id: 'PROJ-3',
  status: 'DONE',
  // FIX: Date objects assigned directly
  createdAt: new Date(new Date().setDate(new Date().getDate() - 20)),
  updatedAt: new Date(new Date().setDate(new Date().getDate() - 15)), // 15 days ago (outside 7 days window)
  sprintId: 'sprint-1-active',
};

const mockBacklogIssue: Issue = {
  ...mockIssue,
  id: 'PROJ-4',
  // FIX: Used 'undefined' for optional string property instead of 'null'
  sprintId: undefined,
};

const mockIssues: Issue[] = [
  mockIssue,
  mockCompletedIssue,
  mockOldCompletedIssue,
  mockBacklogIssue,
];

const mockSprints: Sprint[] = [
  {
    id: 'sprint-1-active',
    name: 'Active Sprint',
    status: 'ACTIVE',
    // FIX: Date objects assigned directly
    startDate: new Date(new Date().setDate(new Date().getDate() - 10)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 5)), // Ends 5 days from now
  },
  {
    id: 'sprint-2-planned',
    name: 'Planned Sprint',
    status: 'PLANNED',
    // FIX: Date objects assigned directly
    startDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 15)),
  },
];

describe('IssueSummaryService', () => {
  let service: IssueSummaryService;
  let mockAllIssuesSpy: jasmine.Spy;
  let mockAllSprintsSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IssueSummaryService);

    // Spy on the private methods that aggregate data.
    mockAllIssuesSpy = spyOn<any>(service, 'getAllIssues').and.returnValue(mockIssues);
    mockAllSprintsSpy = spyOn(service, 'getAllSprints').and.returnValue(mockSprints);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- getIssuesBySprintId Tests ---
  describe('getIssuesBySprintId', () => {
    it('should return all issues when sprintId is null or "all"', () => {
      expect(service.getIssuesBySprintId(null).length).toBe(mockIssues.length);
      expect(service.getIssuesBySprintId('all').length).toBe(mockIssues.length);
    });

    it('should return only issues for a specific sprint ID', () => {
      const activeIssues = service.getIssuesBySprintId('sprint-1-active');
      expect(activeIssues.length).toBe(3); // PROJ-1, PROJ-2, PROJ-3
      expect(activeIssues.every((issue) => issue.sprintId === 'sprint-1-active')).toBeTrue();
    });
  });

  // --- Summary Count Helpers Tests (within 7 days) ---
  describe('Summary Count Helpers', () => {
    const days = 7; // The default is 7 days

    it('should correctly count completed issues within the last 7 days', () => {
      // PROJ-2 updated 3 days ago (within 7 days).
      const count = service.getCompletedIssuesCount('sprint-1-active', days);
      expect(count).toBe(1);
    });

    it('should correctly count updated issues within the last 7 days', () => {
      // PROJ-1 updated 1 day ago. PROJ-2 updated 3 days ago.
      const count = service.getUpdatedIssuesCount('sprint-1-active', days);
      expect(count).toBe(2);
    });

    it('should correctly count created issues within the last 7 days', () => {
      const recentIssue: Issue = {
        ...mockIssue,
        id: 'PROJ-99',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 3)), // 3 days ago
      };
      mockAllIssuesSpy.and.returnValue([...mockIssues, recentIssue]);

      const countAll = service.getCreatedIssuesCount('all', days);
      expect(countAll).toBe(1);
    });
  });

  // --- getIssueSummaryCards Test ---
  describe('getIssueSummaryCards', () => {
    it('should return four summary card objects', () => {
      const cards = service.getIssueSummaryCards('sprint-1-active');
      expect(cards.length).toBe(4);
      expect(cards.map((c) => c.type)).toEqual(['completed', 'updated', 'created', 'due-soon']);
    });
  });

  // --- getSprintStatuses Test ---
  describe('getSprintStatuses', () => {
    it('should correctly group issues by status for a given sprint', () => {
      // PROJ-1: TODO, PROJ-2: DONE, PROJ-3: DONE. (Active sprint issues)
      const statuses = service.getSprintStatuses('sprint-1-active');

      const todoStatus = statuses.find((s) => s.label === 'To Do');
      const inProgressStatus = statuses.find((s) => s.label === 'In Progress');
      const doneStatus = statuses.find((s) => s.label === 'Done');

      expect(todoStatus?.count).toBe(1);
      expect(inProgressStatus?.count).toBe(0);
      expect(doneStatus?.count).toBe(2);
    });
  });

  // --- getRecentIssues Test ---
  describe('getRecentIssues', () => {
    it('should return the most recently created issues, up to the limit', () => {
      const moreMockIssues: Issue[] = [
        ...mockIssues,
        {
          ...mockIssue,
          id: 'PROJ-5',
          createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        },
        {
          ...mockIssue,
          id: 'PROJ-6',
          createdAt: new Date(new Date().setDate(new Date().getDate() - 0.5)),
        },
      ];
      mockAllIssuesSpy.and.returnValue(moreMockIssues);

      const recent = service.getRecentIssues(null, 3);
      expect(recent.length).toBe(3);
      expect(recent[0].code).toBe('PROJ-6'); // Most recent
      expect(recent[1].code).toBe('PROJ-5'); // Second most recent
    });

    it('should correctly map issue properties and generate assignee initials/color', () => {
      const recent = service.getRecentIssues(null, 1);
      const mappedIssue = recent[0];

      expect(mappedIssue.statusBg).toBe('#3B82F6'); // STORY color
      expect(mappedIssue.statusLetter).toBe('S'); // STORY letter
      expect(mappedIssue.assigneeInitials).toBe('JD'); // John Doe -> JD
      expect(mappedIssue.priority).toBe('High');
    });

    it('should handle unassigned issue correctly', () => {
      const unassignedIssue: Issue = {
        ...mockIssue,
        id: 'PROJ-7',
        assignee: undefined, // FIX: Used undefined
        createdAt: new Date(),
      };
      mockAllIssuesSpy.and.returnValue([unassignedIssue]);

      const recent = service.getRecentIssues(null, 1);
      const mappedIssue = recent[0];

      expect(mappedIssue.assigneeInitials).toBe('UN'); // Unassigned -> UN
    });
  });

  // --- Private Helper Tests ---
  describe('stringToHslColor', () => {
    it('should generate the same color for the same string', () => {
      const color1 = service['stringToHslColor']('JD', 70, 45);
      const color2 = service['stringToHslColor']('JD', 70, 45);
      expect(color1).toBe(color2);
    });
  });
});
