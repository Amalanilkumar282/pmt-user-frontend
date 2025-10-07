import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { RecenIssues } from './recen-issues';

describe('RecenIssues', () => {
  let component: RecenIssues;
  let fixture: ComponentFixture<RecenIssues>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RecenIssues] }).compileComponents();
    fixture = TestBed.createComponent(RecenIssues);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render issues when input provided', () => {
    component.issues = [
      { title: 'One', code: 'I1', statusBg: '', statusLetter: 'T', assigneeBg: '', assigneeInitials: 'JD', description: '', status: '', priority: '' },
    ] as any;
    fixture.detectChanges();
    // the template renders items inside a container with class 'space-y-0'
    const rows = fixture.debugElement.queryAll(By.css('.space-y-0 > div'));
    expect(rows.length).toBe(1);
    const titleEl = rows[0].query(By.css('.text-status-blue'));
    expect(titleEl.nativeElement.textContent.trim()).toBe('One');
  });
});
