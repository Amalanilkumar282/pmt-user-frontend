import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectCard, ProjectCardModel } from './project-card';
import { RouterTestingModule } from '@angular/router/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ProjectCard', () => {
  let component: ProjectCard;
  let fixture: ComponentFixture<ProjectCard>;
  let compiled: HTMLElement;

  const mockProject: ProjectCardModel = {
    id: 'proj-123',
    name: 'E-Commerce Platform',
    type: 'Web Application',
    status: 'Active',
    sprint: 'Sprint 5',
    tasks: {
      toDo: 8,
      inProgress: 4,
      done: 12,
    },
    teamMembers: ['JD', 'AS', 'MK'],
    deadline: 'Dec 15, 2024',
    updated: '2 hours ago',
    starred: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCard, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCard);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      component.project = mockProject;
      fixture.detectChanges();
    });

    it('should display project name', () => {
      const nameElement = compiled.querySelector('.project-info h3');
      expect(nameElement?.textContent?.trim()).toBe('E-Commerce Platform');
    });

    it('should display project type', () => {
      const typeElement = compiled.querySelector('.project-info p');
      expect(typeElement?.textContent?.trim()).toBe('Web Application');
    });

    it('should display project avatar with first letter', () => {
      const avatarElement = compiled.querySelector('.project-avatar');
      expect(avatarElement?.textContent?.trim()).toBe('E');
    });

    it('should display status badge', () => {
      const statusBadge = compiled.querySelector('.status-badge');
      expect(statusBadge?.textContent?.trim()).toBe('Active');
    });

    it('should apply completed class when status is Completed', () => {
      component.project = { ...mockProject, status: 'Completed' };
      fixture.detectChanges();

      const statusBadge = compiled.querySelector('.status-badge');
      expect(statusBadge?.classList.contains('completed')).toBe(true);
    });

    it('should display sprint information', () => {
      const sprintInfo = compiled.querySelector('.sprint-badge');
      expect(sprintInfo?.textContent).toContain('Sprint 5');
    });

    it('should display task statistics correctly', () => {
      const taskNumbers = compiled.querySelectorAll('.task-number');
      expect(taskNumbers[0].textContent?.trim()).toBe('8');
      expect(taskNumbers[1].textContent?.trim()).toBe('4');
      expect(taskNumbers[2].textContent?.trim()).toBe('12');
    });

    it('should display task labels correctly', () => {
      const taskLabels = compiled.querySelectorAll('.task-label');
      expect(taskLabels[0].textContent?.trim()).toBe('To Do');
      expect(taskLabels[1].textContent?.trim()).toBe('In Progress');
      expect(taskLabels[2].textContent?.trim()).toBe('Done');
    });

    it('should display team members', () => {
      const memberAvatars = compiled.querySelectorAll('.member-avatar');
      expect(memberAvatars.length).toBe(3);
      expect(memberAvatars[0].textContent?.trim()).toBe('JD');
      expect(memberAvatars[1].textContent?.trim()).toBe('AS');
      expect(memberAvatars[2].textContent?.trim()).toBe('MK');
    });

    it('should display deadline', () => {
      const deadlineText = compiled.querySelector('.project-meta')?.textContent;
      expect(deadlineText).toContain('Dec 15, 2024');
    });

    it('should display updated time', () => {
      const updatedText = compiled.querySelector('.text-muted')?.textContent;
      expect(updatedText).toContain('2 hours ago');
    });
  });

  describe('Star Functionality', () => {
    beforeEach(() => {
      component.project = mockProject;
      fixture.detectChanges();
    });

    it('should display unstarred icon when project is not starred', () => {
      const starButton = compiled.querySelector('.star-btn');
      expect(starButton?.classList.contains('starred')).toBe(false);
    });

    it('should display starred icon when project is starred', () => {
      component.project = { ...mockProject, starred: true };
      fixture.detectChanges();

      const starButton = compiled.querySelector('.star-btn');
      expect(starButton?.classList.contains('starred')).toBe(true);
    });

    it('should toggle starred state from false to true', () => {
      spyOn(component.starToggled, 'emit');
      component.project.starred = false;

      component.toggleStar();

      expect(component.starToggled.emit).toHaveBeenCalledWith({
        id: 'proj-123',
        starred: true,
      });
    });

    it('should toggle starred state from true to false', () => {
      spyOn(component.starToggled, 'emit');
      component.project.starred = true;

      component.toggleStar();

      expect(component.starToggled.emit).toHaveBeenCalledWith({
        id: 'proj-123',
        starred: false,
      });
    });
  });

  describe('Router Link', () => {
    beforeEach(() => {
      component.project = mockProject;
      fixture.detectChanges();
    });

    it('should wrap the entire card in a link', () => {
      const link = compiled.querySelector('a[routerLink]');
      const card = link?.querySelector('.project-card');
      expect(card).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty team members array', () => {
      component.project = { ...mockProject, teamMembers: [] };
      fixture.detectChanges();

      const memberAvatars = compiled.querySelectorAll('.member-avatar');
      expect(memberAvatars.length).toBe(0);
    });

    it('should handle zero task counts', () => {
      component.project = {
        ...mockProject,
        tasks: { toDo: 0, inProgress: 0, done: 0 },
      };
      fixture.detectChanges();

      const taskNumbers = compiled.querySelectorAll('.task-number');
      expect(taskNumbers[0].textContent?.trim()).toBe('0');
      expect(taskNumbers[1].textContent?.trim()).toBe('0');
      expect(taskNumbers[2].textContent?.trim()).toBe('0');
    });

    it('should handle single character project names', () => {
      component.project = { ...mockProject, name: 'A' };
      fixture.detectChanges();

      const avatarElement = compiled.querySelector('.project-avatar');
      expect(avatarElement?.textContent?.trim()).toBe('A');
    });

    it('should handle long project names', () => {
      const longName = 'Very Long Project Name That Exceeds Normal Length';
      component.project = { ...mockProject, name: longName };
      fixture.detectChanges();

      const nameElement = compiled.querySelector('.project-info h3');
      expect(nameElement?.textContent?.trim()).toBe(longName);
    });

    it('should handle many team members', () => {
      component.project = {
        ...mockProject,
        teamMembers: ['JD', 'AS', 'MK', 'LT', 'PR', 'SG', 'TH'],
      };
      fixture.detectChanges();

      const memberAvatars = compiled.querySelectorAll('.member-avatar');
      expect(memberAvatars.length).toBe(7);
    });
  });

  describe('Component Input', () => {
    it('should accept project input', () => {
      component.project = mockProject;
      expect(component.project).toBe(mockProject);
    });

    it('should update view when project input changes', () => {
      component.project = mockProject;
      fixture.detectChanges();

      let nameElement = compiled.querySelector('.project-info h3');
      expect(nameElement?.textContent?.trim()).toBe('E-Commerce Platform');

      component.project = { ...mockProject, name: 'New Project Name' };
      fixture.detectChanges();

      nameElement = compiled.querySelector('.project-info h3');
      expect(nameElement?.textContent?.trim()).toBe('New Project Name');
    });
  });
});
