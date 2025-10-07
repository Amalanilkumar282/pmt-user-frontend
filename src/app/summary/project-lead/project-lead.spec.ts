// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { ProjectLead } from './project-lead';

// describe('ProjectLead', () => {
//   let component: ProjectLead;
//   let fixture: ComponentFixture<ProjectLead>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [ProjectLead]
//     })
//     .compileComponents();

//     fixture = TestBed.createComponent(ProjectLead);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

// Import the necessary interface
import { ProjectLead, Lead } from './project-lead';

describe('ProjectLead', () => {
  let component: ProjectLead;
  let fixture: ComponentFixture<ProjectLead>;

  const mockLeadData: Lead = {
    initials: 'JD',
    name: 'Jane Doe',
    role: 'Senior Developer',
    bgColor: 'bg-red-500', // Using a placeholder class/value
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectLead], // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectLead);
    component = fixture.componentInstance;
    // NOTE: fixture.detectChanges() is intentionally deferred until component.leadData is set.
  });

  it('should create', () => {
    // Set the input just to allow creation check
    // component.leadData = mockLeadData;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should render the lead's name, role, and initials from input ", () => {
    // 1. Set the Input property
    component.leadData = mockLeadData;

    // 2. Trigger change detection to update the view
    fixture.detectChanges();

    // 3. Query and assert the rendered values using their specific CSS classes

  // Use the compiled DOM for simpler, more robust queries
  const compiled = fixture.nativeElement as HTMLElement;
  const nameEl = compiled.querySelector('h4');
  const roleEl = compiled.querySelector('p');
  const initialsEl = compiled.querySelector('div > span');

  expect(nameEl).withContext('Name element should exist').toBeTruthy();
  expect(roleEl).withContext('Role element should exist').toBeTruthy();
  expect(initialsEl).withContext('Initials element should exist').toBeTruthy();

  expect(nameEl?.textContent?.trim()).toBe(mockLeadData.name, 'Name should match input');
  expect(roleEl?.textContent?.trim()).toBe(mockLeadData.role, 'Role should match input');
  expect(initialsEl?.textContent?.trim()).toBe(mockLeadData.initials, 'Initials should match input');
  });

  it('should apply the correct background class to the avatar element (testing NgClass)', () => {
    // 1. Set the Input property
    const customBgData: Lead = { ...mockLeadData, bgColor: 'bg-custom-blue' };
    component.leadData = customBgData;

    // 2. Trigger change detection
    fixture.detectChanges();

    // 3. Query the avatar container (where ngClass is used) using its dimension class
    const avatarContainer = fixture.debugElement.query(By.css('.w-\\[22px\\]'));

    // 4. Check if the initial class 'bg-status-accent' is present
    expect(avatarContainer.nativeElement.classList).toContain('bg-status-accent');

    // 5. Check if the bound class from leadData.bgColor is present
    expect(avatarContainer.nativeElement.classList).toContain(customBgData.bgColor);
  });

  it('should display "Project Lead" as the title ', () => {
    component.leadData = mockLeadData;
    fixture.detectChanges();

    // Select the Title using its class
    const titleElement = fixture.debugElement.query(By.css('.text-\\[17px\\]'))
      .nativeElement as HTMLElement;
    expect(titleElement.textContent?.trim()).toBe('Project Lead');
  });
});
