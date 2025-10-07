import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ProjectInfo } from './project-info';

describe('ProjectInfo', () => {
  let component: ProjectInfo;
  let fixture: ComponentFixture<ProjectInfo>;

  // Selector for the project detail items
  const projectDetailSelector = '[data-testid="project-detail"]';
  // Selector for the main title
  const titleSelector = '[data-testid="project-info-title"]';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectInfo],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectInfo);
    component = fixture.componentInstance;
    // fixture.detectChanges() is called later in the tests as needed
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test case for displaying the title
  it('should display the title "Project Info"', () => {
    fixture.detectChanges();
    const titleElement = fixture.debugElement.query(By.css(titleSelector)).nativeElement;
    expect(titleElement.textContent).toContain('Project Info');
  });

  // Test case for default state (no input provided)
  it('should render no details if projectDetails input is null or undefined', () => {
    // Component is created, projectDetails is undefined by default
    fixture.detectChanges();

    // Check that no detail paragraphs are rendered using the specific selector
    const detailElements = fixture.debugElement.queryAll(By.css(projectDetailSelector));
    expect(detailElements.length).toBe(0);
  });

  // Test case for empty array input
  it('should render no details if projectDetails input is an empty array', () => {
    component.projectDetails = [];
    fixture.detectChanges();

    // Check that no detail paragraphs are rendered using the specific selector
    const detailElements = fixture.debugElement.queryAll(By.css(projectDetailSelector));
    expect(detailElements.length).toBe(0);
  });

  // Test case for custom input
  it('should correctly render project details from the input array', () => {
    const mockDetails = [
      { label: 'Name', value: 'Acme Corp' },
      { label: 'Type', value: 'Frontend' },
      { label: 'Created Date', value: '2025-12-31' },
    ];

    component.projectDetails = mockDetails;
    fixture.detectChanges();

    // Query using the stable data-testid selector
    const detailElements = fixture.debugElement.queryAll(By.css(projectDetailSelector));

    // Check that the correct number of elements are rendered
    expect(detailElements.length).toBe(mockDetails.length);

    // Check the content of each rendered detail
    detailElements.forEach((de, index) => {
      const detail = mockDetails[index];
      const textContent = de.nativeElement.textContent.trim().replace(/\s+/g, ' '); // Normalize whitespace

      // Check the bold label
      const labelElement = de.query(By.css('.font-bold')).nativeElement;
      expect(labelElement.textContent).toBe(`${detail.label}:`);

      // Check the entire paragraph text content
      expect(textContent).toBe(`${detail.label}: ${detail.value}`);
    });
  });
});
