import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivityItem, ActivityModel } from './activity-item';

describe('ActivityItem', () => {
  let component: ActivityItem;
  let fixture: ComponentFixture<ActivityItem>;

  const mockActivity: ActivityModel = {
    id: 'act-123',
    user: 'John Doe',
    initials: 'JD',
    action: 'completed',
    task: 'Update dashboard layout',
    taskId: 'TASK-456',
    time: '2 hours ago',
    type: 'completed',
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

  it('should display user initials in avatar', () => {
    const avatar = fixture.debugElement.query(By.css('.activity-avatar'));
    expect(avatar.nativeElement.textContent.trim()).toBe('JD');
  });

  it('should apply correct type class to avatar', () => {
    const avatar = fixture.debugElement.query(By.css('.activity-avatar'));
    expect(avatar.classes[mockActivity.type]).toBeTrue();
  });

  it('should display user name and action', () => {
    const content = fixture.debugElement.query(By.css('.activity-content p'));
    expect(content.nativeElement.textContent).toContain(mockActivity.user);
    expect(content.nativeElement.textContent).toContain(mockActivity.action);
  });

  it('should display task details', () => {
    const content = fixture.debugElement.query(By.css('.activity-content p'));
    expect(content.nativeElement.textContent).toContain(mockActivity.task);
  });

  it('should display task ID and time', () => {
    const taskId = fixture.debugElement.query(By.css('.task-id'));
    const time = fixture.debugElement.query(By.css('.activity-time'));

    expect(taskId.nativeElement.textContent).toBe(mockActivity.taskId);
    expect(time.nativeElement.textContent).toContain(mockActivity.time);
  });

  describe('Activity Types', () => {
    it('should handle "completed" type correctly', () => {
      testActivityType('completed');
    });

    it('should handle "commented" type correctly', () => {
      testActivityType('commented');
    });

    it('should handle "assigned" type correctly', () => {
      testActivityType('assigned');
    });

    function testActivityType(type: ActivityModel['type']) {
      component.activity = { ...mockActivity, type };
      fixture.detectChanges();
      const avatar = fixture.debugElement.query(By.css('.activity-avatar'));
      expect(avatar.classes[type]).toBeTrue();
    }
  });
});
