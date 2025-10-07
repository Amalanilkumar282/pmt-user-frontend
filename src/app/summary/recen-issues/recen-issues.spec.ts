import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

// IMPORTANT: Ensure the Issue interface is exported from './recen-issues'
import { RecenIssues, Issue } from './recen-issues';

// --- Mock Data ---
const mockIssues: Issue[] = [
  {
    title: 'Update database schema',
    code: 'PROJ-101',
    statusBg: 'rgb(245, 158, 11)', // Orange
    statusLetter: 'W',
    assigneeBg: 'rgb(107, 114, 128)', // Gray
    assigneeInitials: 'AS',
    description: 'Schema needs adjustment for new feature.',
    status: 'To Do',
    priority: 'High',
  },
  {
    title: 'Fix mobile responsiveness',
    code: 'PROJ-102',
    statusBg: 'rgb(16, 185, 129)', // Green
    statusLetter: 'D',
    assigneeBg: 'rgb(239, 68, 68)', // Red
    assigneeInitials: 'JD',
    description: 'The layout breaks on screen sizes < 768px.',
    status: 'Done',
    priority: 'Medium',
  },
  {
    title: 'New feature planning',
    code: 'PROJ-103',
    statusBg: 'rgb(59, 130, 246)', // Blue
    statusLetter: 'P',
    assigneeBg: 'rgb(20, 184, 166)', // Teal
    assigneeInitials: 'LM',
  },
];
// -----------------

describe('RecenIssues', () => {
  let component: RecenIssues;
  let fixture: ComponentFixture<RecenIssues>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecenIssues],
    }).compileComponents();

    fixture = TestBed.createComponent(RecenIssues);
    component = fixture.componentInstance;
    // Note: fixture.detectChanges() is called later in most tests after setting the input data
  });

  // --- 1. Core Component Test (Should always pass) ---
  it('should create the component successfully', () => {
    component.issues = [];
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // --- 2. Static Content Test (Uses data-testid="issues-title") ---
  it('should display the main card title "Recent Issues"', () => {
    component.issues = [];
    fixture.detectChanges();
    const titleElement = fixture.debugElement.query(
      By.css('[data-testid="issues-title"]')
    ).nativeElement;
    expect(titleElement.textContent?.trim()).toBe('Recent Issues');
  });

  // --- 3. Edge Case: Empty List ---
  it('should render zero issues when the input array is empty', () => {
    component.issues = [];
    fixture.detectChanges();
    // Querying by the assumed issue row test ID should yield no results
    const issueContainers = fixture.debugElement.queryAll(By.css('[data-testid^="issue-row"]'));
    expect(issueContainers.length).toBe(0, 'Should not render any issue items');
  });

  // --- 4. Iteration Test (Assumes data-testid="issue-row-") ---
  it('should render the correct number of issue elements when data is provided', () => {
    component.issues = mockIssues;
    fixture.detectChanges();
    const issueContainers = fixture.debugElement.queryAll(By.css('[data-testid^="issue-row"]'));
    expect(issueContainers.length).toBe(mockIssues.length);
  });

  // --- 5. Data Binding (Title) (Assumes data-testid="issue-title") ---
  it('should correctly bind and display the issue title text content', () => {
    component.issues = mockIssues;
    fixture.detectChanges();
    // Get all titles and check the first one
    const titleElement = fixture.debugElement.query(
      By.css('[data-testid="issue-title"]')
    ).nativeElement;
    expect(titleElement.textContent?.trim()).toBe(mockIssues[0].title);
  });

  // --- 6. Data Binding (Code) (Assumes data-testid="issue-code") ---
  it('should correctly bind and display the issue code text content', () => {
    component.issues = mockIssues;
    fixture.detectChanges();
    // Get all codes and check the second one
    const codeElements = fixture.debugElement.queryAll(By.css('[data-testid="issue-code"]'));
    expect(codeElements[1].nativeElement.textContent?.trim()).toBe(mockIssues[1].code);
  });

  // --- 7. Style Binding (Status Icon) (Assumes data-testid="status-icon") ---
  it('should apply the correct background color via style binding to the status icon', () => {
    component.issues = mockIssues;
    fixture.detectChanges();
    const statusIcon = fixture.debugElement.query(
      By.css('[data-testid="status-icon"]')
    ).nativeElement;
    expect(statusIcon.style.backgroundColor).toBe(mockIssues[0].statusBg);
  });

  // --- 8. Style Binding (Assignee Icon) (Assumes data-testid="assignee-icon") ---
  it('should apply the correct background color via style binding to the assignee icon', () => {
    component.issues = mockIssues;
    fixture.detectChanges();
    const assigneeIcon = fixture.debugElement.queryAll(By.css('[data-testid="assignee-icon"]'))[1]
      .nativeElement;
    expect(assigneeIcon.style.backgroundColor).toBe(mockIssues[1].assigneeBg);
  });

  // --- 9. Conditional Class Binding (Assumes data-testid="issue-row-") ---
  it('should correctly apply the border-b class only to non-last issue items', () => {
    component.issues = mockIssues; // 3 issues
    fixture.detectChanges();
    const issueContainers = fixture.debugElement.queryAll(By.css('[data-testid^="issue-row"]'));

    // Check a non-last item (e.g., the first one)
    expect(issueContainers[0].nativeElement.classList.contains('border-b')).toBe(
      true,
      'Non-last issue should have border-b'
    );

    // Check the last item
    expect(issueContainers[2].nativeElement.classList.contains('border-b')).toBe(
      false,
      'Last issue should NOT have border-b'
    );
  });
});
