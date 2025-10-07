import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskCard } from './task-card';

describe('TaskCard', () => {
  let component: TaskCard;
  let fixture: ComponentFixture<TaskCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getPriorityClass returns expected classes', () => {
    expect(component.getPriorityClass('CRITICAL')).toContain('bg-red');
    expect(component.getPriorityClass('HIGH')).toContain('bg-orange');
    expect(component.getPriorityClass('MEDIUM')).toContain('bg-yellow');
    expect(component.getPriorityClass('LOW')).toContain('bg-green');
    expect(component.getPriorityClass('UNKNOWN')).toContain('bg-gray');
  });

  it('getInitials works for names and undefined', () => {
    expect(component.getInitials('John Doe')).toBe('JD');
    expect(component.getInitials('Single')).toBe('S');
    expect(component.getInitials(undefined)).toBe('?');
  });
});
