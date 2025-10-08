import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectCard, ProjectCardModel } from './project-card';
import { RouterTestingModule } from '@angular/router/testing';

describe('ProjectCard', () => {
  let component: ProjectCard;
  let fixture: ComponentFixture<ProjectCard>;

  const mockProject: ProjectCardModel = {
    id: 'project-1',
    name: 'Test Project',
    type: 'Scrum',
    status: 'Active',
    sprint: 'Sprint 1',
    tasks: { toDo: 5, inProgress: 3, done: 10 },
    teamMembers: ['John Doe', 'Jane Smith'],
    deadline: '2024-12-31',
    updated: '2024-01-15',
    starred: false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCard, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectCard);
    component = fixture.componentInstance;
    component.project = mockProject;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept project input', () => {
    expect(component.project).toEqual(mockProject);
  });

  it('should emit starToggled event with true when star is toggled from false', () => {
    component.project = { ...mockProject, starred: false };
    spyOn(component.starToggled, 'emit');

    component.toggleStar();

    expect(component.starToggled.emit).toHaveBeenCalledWith({
      id: 'project-1',
      starred: true
    });
  });

  it('should emit starToggled event with false when star is toggled from true', () => {
    component.project = { ...mockProject, starred: true };
    spyOn(component.starToggled, 'emit');

    component.toggleStar();

    expect(component.starToggled.emit).toHaveBeenCalledWith({
      id: 'project-1',
      starred: false
    });
  });

  it('should not emit event if project is undefined', () => {
    component.project = undefined as any;
    spyOn(component.starToggled, 'emit');

    component.toggleStar();

    expect(component.starToggled.emit).not.toHaveBeenCalled();
  });

  it('should handle project with no starred property', () => {
    const projectWithoutStar = { ...mockProject };
    delete projectWithoutStar.starred;
    component.project = projectWithoutStar;
    spyOn(component.starToggled, 'emit');

    component.toggleStar();

    expect(component.starToggled.emit).toHaveBeenCalledWith({
      id: 'project-1',
      starred: true
    });
  });

  it('should have correct project properties', () => {
    expect(component.project.name).toBe('Test Project');
    expect(component.project.type).toBe('Scrum');
    expect(component.project.status).toBe('Active');
    expect(component.project.tasks.toDo).toBe(5);
    expect(component.project.tasks.inProgress).toBe(3);
    expect(component.project.tasks.done).toBe(10);
  });
});
