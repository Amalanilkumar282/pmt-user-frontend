import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { MainDashboardHome } from './main-dashboard-home';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { IssueSummaryCard } from '../../summary/issue-summary-card/issue-summary-card';
import { ProjectCard } from '../project-card/project-card';
import { SprintOverview } from '../../summary/sprint-overview/sprint-overview';
import { ActivityItem } from '../activity-item/activity-item';
import { Header } from '../../shared/header/header';
import { Sidebar } from '../../shared/sidebar/sidebar';

describe('MainDashboardHome', () => {
  let component: MainDashboardHome;
  let fixture: ComponentFixture<MainDashboardHome>;

  let sidebarService: SidebarStateService;

  beforeEach(async () => {
    localStorage.removeItem('sidebar-collapsed-state');
    await TestBed.configureTestingModule({
      imports: [
        MainDashboardHome,
        RouterTestingModule,
        HttpClientModule,
        IssueSummaryCard,
        ProjectCard,
        SprintOverview,
        ActivityItem,
        Header,
        Sidebar,
      ],
      providers: [
        SidebarStateService,
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map() } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainDashboardHome);
    component = fixture.componentInstance;
    sidebarService = TestBed.inject(SidebarStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial Rendering', () => {
    it('should render welcome message with user name', () => {
      const welcomeSection = fixture.debugElement.query(By.css('.welcome-section'));
      expect(welcomeSection.nativeElement.textContent).toContain('Welcome back, Harrel!');
    });

    it('should render all stats cards', () => {
      const statsCards = fixture.debugElement.queryAll(By.directive(IssueSummaryCard));
      expect(statsCards.length).toBe(3);
    });

    it('should render correct stats values', () => {
      const [activeProjects, issuesInProgress, activeSprintsCard] = fixture.debugElement.queryAll(
        By.directive(IssueSummaryCard)
      );

      expect(activeProjects.componentInstance.count).toBe(component.stats.activeProjects);
      expect(issuesInProgress.componentInstance.count).toBe(component.stats.issuesInProgress);
      expect(activeSprintsCard.componentInstance.count).toBe(component.stats.sprintsInProgress);
    });

    it('should render project cards', () => {
      const projectCards = fixture.debugElement.queryAll(By.directive(ProjectCard));
      expect(projectCards.length).toBe(component.projects.length);
    });

    it('should render sprint overview with correct status counts', () => {
      const sprintOverview = fixture.debugElement.query(By.directive(SprintOverview));
      expect(sprintOverview).toBeTruthy();
      expect(sprintOverview.componentInstance.statuses).toEqual(component.sprintStatuses);
    });

    it('should render activity items', () => {
      const activityItems = fixture.debugElement.queryAll(By.directive(ActivityItem));
      expect(activityItems.length).toBeGreaterThan(0);
    });
  });

  describe('Sidebar Integration', () => {
    it('should handle sidebar collapse state', () => {
      // Initially not collapsed
      let mainContent = fixture.debugElement.query(By.css('.dashboard-container'));
      expect(mainContent.classes['sidebar-collapsed']).toBeFalsy();

      // Simulate collapse
      sidebarService.setCollapsed(true);
      fixture.detectChanges();

      // Re-query the element after change detection
      mainContent = fixture.debugElement.query(By.css('.dashboard-container'));
      expect(mainContent.classes['sidebar-collapsed']).toBeTrue();
    });
  });

  describe('Project Interactions', () => {
    it('should handle star toggle events from project cards', () => {
      spyOn(component, 'toggleStar');
      const firstProjectCard = fixture.debugElement.query(By.directive(ProjectCard));

      firstProjectCard.componentInstance.starToggled.emit({ id: '1', starred: true });

      expect(component.toggleStar).toHaveBeenCalledWith({ id: '1', starred: true });
    });

    it('should navigate to projects page when view all is clicked', () => {
      const viewAllAnchor = fixture.debugElement.query(By.css('a[routerLink="/projects"]'));
      expect(viewAllAnchor).toBeTruthy();
      expect(viewAllAnchor.attributes['routerLink']).toBe('/projects');
    });
  });

  describe('Task Status Overview', () => {
    it('should calculate and display correct task status distribution', () => {
      const { toDo, inProgress, completed, onHold } = component.taskStatus;
      const statuses = component.sprintStatuses;

      expect(statuses.find((s) => s.label === 'To Do')).toEqual({
        label: 'To Do',
        count: toDo,
        colorClass: 'bg-blue-500',
      });

      expect(statuses.find((s) => s.label === 'In Progress')).toEqual({
        label: 'In Progress',
        count: inProgress,
        colorClass: 'bg-yellow-500',
      });

      expect(statuses.find((s) => s.label === 'Completed')).toEqual({
        label: 'Completed',
        count: completed,
        colorClass: 'bg-green-500',
      });

      expect(statuses.find((s) => s.label === 'On Hold')).toEqual({
        label: 'On Hold',
        count: onHold,
        colorClass: 'bg-purple-500',
      });

      // Verify total number of statuses
      expect(statuses.length).toBe(4);
    });
  });
});
