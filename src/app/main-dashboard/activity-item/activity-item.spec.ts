import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivityItem, ActivityModel } from './activity-item';

describe('ActivityItem', () => {
  let component: ActivityItem;
  let fixture: ComponentFixture<ActivityItem>;

  const mockActivity: ActivityModel = {
    id: 'act-123',
    userId: 1,
    userName: 'John Doe',
    action: 'COMPLETE',
    entityType: 'ISSUE',
    entityId: 'TASK-456',
    description: '',
    createdAt: new Date().toISOString(),
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

  it('should compute activityType from action/entity', () => {
    // activity.action = 'COMPLETE' and entityType = 'ISSUE' should map to 'completed'
    expect(component.activityType).toBe('completed');
  });

  it('should display user name and activity sentence', () => {
    const content = fixture.debugElement.query(By.css('.activity-content p'));
    expect(content.nativeElement.textContent).toContain(mockActivity.userName);
    expect(content.nativeElement.textContent).toContain(component.activitySentence);
  });

  it('should display activity sentence and created time', () => {
    const content = fixture.debugElement.query(By.css('.activity-content p'));
    // constructed sentence for COMPLETE + ISSUE -> 'completed an issue'
    expect(content.nativeElement.textContent).toContain('completed');
    expect(content.nativeElement.textContent).toContain('an issue');

    const timeElem = fixture.debugElement.query(By.css('.flex.items-center'));
    expect(timeElem).toBeTruthy();
  });

  describe('Activity Types', () => {
    it('should handle "completed" type correctly', () => {
      testActivityType('COMPLETE', 'completed');
    });

    it('should handle "commented" type correctly', () => {
      testActivityType('COMMENT', 'commented');
    });

    it('should handle "assigned" type correctly', () => {
      testActivityType('ASSIGN', 'assigned');
    });

    function testActivityType(actionValue: string, expectedType: string) {
      component.activity = { ...mockActivity, action: actionValue } as any;
      fixture.detectChanges();
      expect(component.activityType).toBe(expectedType as any);
    }
  });
});
