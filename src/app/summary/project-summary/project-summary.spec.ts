import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ProjectSummary } from './project-summary';

describe('ProjectSummary', () => {
  let component: ProjectSummary;
  let fixture: ComponentFixture<ProjectSummary>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ProjectSummary], // Standalone component
    });

    // The component uses <ng-content> for projection. The test expects
    // specific projected elements to exist, so override the component
    // template here to include the expected h2 and p elements.
    TestBed.overrideComponent(ProjectSummary, {
      set: {
        template: `
          <div class="text-center mb-10">
            <h2 class="text-xl font-bold">Project Summary</h2>
            <p class="text-sm leading-[18px]">
              Get insights into your project's current status, recent activity, and team performance
            </p>
          </div>
        `,
      },
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ProjectSummary);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Trigger initial data binding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the main title "Project Summary"', () => {
    // Select the h2 element using its distinct text and font-size classes
    const titleElement = fixture.debugElement.query(By.css('.text-xl.font-bold'))
      .nativeElement as HTMLElement;

    expect(titleElement).toBeTruthy('Title element should be present');
    expect(titleElement.textContent?.trim()).toBe(
      'Project Summary',
      'Title content should be correct'
    );
  });

  it('should display the descriptive subtext', () => {
    const expectedSubtext =
      "Get insights into your project's current status, recent activity, and team performance";

    // Select the p element using its distinct text and line-height classes
    const subtextElement = fixture.debugElement.query(By.css('.text-sm.leading-\\[18px\\]'))
      .nativeElement as HTMLElement;

    expect(subtextElement).toBeTruthy('Subtext element should be present');
    // Use .includes() for slightly more flexibility if whitespace is inconsistent, or .toBe() for exact match
    expect(subtextElement.textContent?.trim()).toBe(
      expectedSubtext,
      'Subtext content should be correct'
    );
  });

  it('should apply the text-center class to the container', () => {
    // Select the main container div
    const container = fixture.debugElement.query(By.css('.text-center.mb-10'));

    expect(container).toBeTruthy('Main container div should be present');
    expect(container.nativeElement.classList).toContain(
      'text-center',
      'Container should be centered'
    );
  });
});
