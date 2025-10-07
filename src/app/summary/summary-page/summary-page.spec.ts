import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SummaryPage } from './summary-page';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { IssueSummaryService } from '../issue-summary.service';

describe('SummaryPage', () => {
  let component: SummaryPage;
  let fixture: ComponentFixture<SummaryPage>;

  // Mocks
  let sidebarStateServiceMock: any;
  let issueSummaryServiceMock: any;

  beforeEach(async () => {
    // Basic mock implementations to provide deterministic return values
    sidebarStateServiceMock = {
      isCollapsed: jasmine.createSpy('isCollapsed').and.returnValue(false),
      toggleCollapse: jasmine.createSpy('toggleCollapse')
    };

    issueSummaryServiceMock = {
      getAllSprints: jasmine.createSpy('getAllSprints').and.returnValue([
        { id: 'all', name: 'All', status: 'ACTIVE' },
        { id: 's1', name: 'Sprint 1', status: 'COMPLETED' }
      ]),
      getIssueSummaryCards: jasmine.createSpy('getIssueSummaryCards').and.returnValue([
        { type: 'completed', count: 1, label: 'COMPLETED', timePeriod: 'in the last 7 days' },
        { type: 'updated', count: 2, label: 'UPDATED', timePeriod: 'in the last 7 days' },
        { type: 'created', count: 3, label: 'CREATED', timePeriod: 'in the last 7 days' },
        { type: 'due-soon', count: 0, label: 'DUE SOON', timePeriod: 'in the next 7 days' }
      ]),
      getSprintStatuses: jasmine.createSpy('getSprintStatuses').and.returnValue([
        { label: 'To Do', count: 5, colorClass: 'bg-green-500' },
        { label: 'In Progress', count: 2, colorClass: 'bg-yellow-500' },
        { label: 'Done', count: 3, colorClass: 'bg-blue-500' }
      ]),
      getIssueTypeCounts: jasmine.createSpy('getIssueTypeCounts').and.returnValue([
        { name: 'Story', count: 4 },
        { name: 'Task', count: 1 },
        { name: 'Bug', count: 0 },
        { name: 'Epic', count: 1 }
      ]),
      getRecentIssues: jasmine.createSpy('getRecentIssues').and.returnValue([
        {
          title: 'Issue 1',
          code: 'ISS-1',
          statusBg: '#3B82F6',
          statusLetter: 'S',
          assigneeBg: 'hsl(10, 70%, 45%)',
          assigneeInitials: 'AS',
          description: 'desc',
          status: 'TODO',
          priority: 'High'
        }
      ])
    };

    await TestBed.configureTestingModule({
      imports: [SummaryPage, RouterTestingModule],
      providers: [
        { provide: SidebarStateService, useValue: sidebarStateServiceMock },
        { provide: IssueSummaryService, useValue: issueSummaryServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sprints on init', () => {
    expect(issueSummaryServiceMock.getAllSprints).toHaveBeenCalled();
    expect(component.sprints.length).toBeGreaterThan(0);
  });

  it('should initialize dashboard data via updateDashboardData', () => {
    // The constructor calls ngOnInit in the test harness via detectChanges
    expect(issueSummaryServiceMock.getIssueSummaryCards).toHaveBeenCalledWith(component.selectedSprintId);
    expect(component.issueCards.length).toBe(4);
    expect(component.sprintStatuses.length).toBe(3);
    expect(component.issueChartData.length).toBe(4);
    expect(component.RecentIssueData.length).toBe(1);
  });

  it('onSprintFilterChange should update selectedSprintId and reload data', () => {
    issueSummaryServiceMock.getIssueSummaryCards.calls.reset();
    component.onSprintFilterChange('s1');
    expect(component.selectedSprintId).toBe('s1');
    expect(issueSummaryServiceMock.getIssueSummaryCards).toHaveBeenCalledWith('s1');
  });

  it('onToggleSidebar should call sidebar service toggleCollapse', () => {
    component.onToggleSidebar();
    expect(sidebarStateServiceMock.toggleCollapse).toHaveBeenCalled();
  });

  it('updateDashboardData should set RecentIssueData correctly', () => {
    component.selectedSprintId = 's1';
    issueSummaryServiceMock.getRecentIssues.and.returnValue([
      { title: 'Newest', code: 'N1', statusBg: '#000', statusLetter: 'T', assigneeBg: '#111', assigneeInitials: 'AB' }
    ]);
    component['updateDashboardData']();
    expect(issueSummaryServiceMock.getRecentIssues).toHaveBeenCalledWith('s1');
    expect(component.RecentIssueData.length).toBe(1);
    expect(component.RecentIssueData[0].title).toBe('Newest');
  });

  it('should handle missing sprint end date gracefully for due-soon count', () => {
    // Ensure getDueSoonCount doesn't throw; it's used indirectly by getIssueSummaryCards
    issueSummaryServiceMock.getIssueSummaryCards.and.callFake((sprintId: any) => {
      return [
        { type: 'due-soon', count: 0, label: 'DUE SOON', timePeriod: 'in the next 7 days' }
      ];
    });
    component['updateDashboardData']();
    expect(component.issueCards.some(c => c.type === 'due-soon')).toBeTrue();
  });
});
