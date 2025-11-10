import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivityItem, ActivityModel } from './activity-item';

describe('ActivityItem', () => {
  let component: ActivityItem;
  let fixture: ComponentFixture<ActivityItem>;

  const mockActivity: ActivityModel = {
    id: 'TASK-456',
    userId: 1,
    userName: 'John Doe',
    action: 'COMPLETE',
    entityType: 'Task',
    entityId: 'TASK-456',
    description: 'Update dashboard layout',
    createdAt: '2025-11-06T10:00:00Z'
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityItem],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityItem);
    component = fixture.componentInstance;
    component.activity = mockActivity;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Removed initials test, not part of ActivityModel
  it('should display user initials in avatar', () => {
    const avatar = fixture.debugElement.query(By.css('div > div'));
    expect(avatar.nativeElement.textContent.trim()).toBe(component.userInitials);
  });

  it('should display user name and description', () => {
    const content = fixture.debugElement.query(By.css('div.flex-1 p'));
    expect(content.nativeElement.textContent).toContain(mockActivity.userName);
    expect(content.nativeElement.textContent).toContain(mockActivity.description);
  });

  it('should display createdAt', () => {
    const time = fixture.debugElement.query(By.css('div.flex.items-center span:last-child'));
    expect(time.nativeElement.textContent).toBeTruthy();
  });
  });

  // Removed invalid Activity Types tests and helper functions
