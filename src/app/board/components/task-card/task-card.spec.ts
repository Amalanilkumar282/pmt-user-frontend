import { TestBed } from '@angular/core/testing';
import { TaskCard } from './task-card';

describe('TaskCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCard]
    }).compileComponents();
  });

  it('getPriorityClass maps known values and defaults', () => {
    const f = TestBed.createComponent(TaskCard).componentInstance;
    expect(f.getPriorityClass('CRITICAL')).toContain('bg-red-100');
    expect(f.getPriorityClass('HIGH')).toContain('bg-orange-100');
    expect(f.getPriorityClass('MEDIUM')).toContain('bg-yellow-100');
    expect(f.getPriorityClass('LOW')).toContain('bg-green-100');
    expect(f.getPriorityClass('UNKNOWN')).toContain('bg-gray-100');
  });

  it('getInitials creates up to 2 letters, or "?"', () => {
    const f = TestBed.createComponent(TaskCard).componentInstance;
    expect(f.getInitials(undefined)).toBe('?');
    expect(f.getInitials('Joy Kumar')).toBe('JK');
    expect(f.getInitials('Ada')).toBe('A');
    expect(f.getInitials('Mary Jane Watson')).toBe('MJ');
  });
});
