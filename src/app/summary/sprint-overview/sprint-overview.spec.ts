import { ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { SprintOverview } from './sprint-overview';

// Mock ApexCharts class
class MockApexCharts {
  constructor(public el: any, public options: any) {}
  render = jasmine.createSpy('render');
  updateOptions = jasmine.createSpy('updateOptions');
  destroy = jasmine.createSpy('destroy');
}

// Mocking the ApexCharts import promise
const mockApexChartsImport = Promise.resolve({ default: MockApexCharts });

// Mock the external function 'isPlatformBrowser'
let isPlatformBrowserSpy: jasmine.Spy;

describe('SprintOverview', () => {
  let component: SprintOverview;
  let fixture: ComponentFixture<SprintOverview>;

  // FIX: Updated mockStatuses to use the color classes supported by the component's getColors method
  let mockStatuses = [
    { label: 'Completed', count: 10, colorClass: 'bg-green-500' },
    { label: 'In Progress', count: 5, colorClass: 'bg-blue-500' },
    { label: 'To Do', count: 8, colorClass: 'bg-yellow-500' },
  ];

  beforeEach(async () => {
    isPlatformBrowserSpy = spyOn({ isPlatformBrowser }, 'isPlatformBrowser').and.returnValue(true);

    // Spy on the dynamic import call and return our mock promise
    spyOn(SprintOverview.prototype as any, 'ngAfterViewInit').and.callFake(async function (
      this: SprintOverview
    ) {
      if (isPlatformBrowser(this['platformId'])) {
        this['ApexCharts'] = (await mockApexChartsImport).default;
        this['renderChart']();
      }
    });

    await TestBed.configureTestingModule({
      imports: [SprintOverview],
      providers: [
        // Provide a default platform ID (e.g., browser)
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SprintOverview);
    component = fixture.componentInstance;
  });

  // --- Utility Functions ---
  const getByTestId = (id: string) => fixture.debugElement.query(By.css(`[data-test-id="${id}"]`));

  // --- Test Cases ---

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display default title and description on initialization', () => {
    fixture.detectChanges();
    const titleEl = getByTestId('sprint-overview-title').nativeElement;
    const descEl = getByTestId('sprint-overview-description').nativeElement;

    expect(titleEl.textContent.trim()).toBe('Sprint overview');
    expect(descEl.textContent.trim()).toBe('Get a snapshot of the status of your work items.');
  });

  it('should display custom title and description from inputs', () => {
    component.title = 'Q4 Project Summary';
    component.description = 'Key performance metrics for Q4.';
    fixture.detectChanges();

    const titleEl = getByTestId('sprint-overview-title').nativeElement;
    const descEl = getByTestId('sprint-overview-description').nativeElement;

    expect(titleEl.textContent.trim()).toBe('Q4 Project Summary');
    expect(descEl.textContent.trim()).toBe('Key performance metrics for Q4.');
  });

  it('should render the status list correctly based on inputs', () => {
    component.statuses = mockStatuses;
    fixture.detectChanges();

    // Check number of status items
    const statusItems = fixture.debugElement.queryAll(By.css('[data-test-id^="status-item-"]'));
    expect(statusItems.length).toBe(mockStatuses.length);

    // Check content and classes for the first item ('Completed')
    const firstStatusLabel = getByTestId('status-label-0').nativeElement;
    const firstStatusCount = getByTestId('status-count-0').nativeElement;
    const firstStatusColor = getByTestId('status-color-0').nativeElement;

    expect(firstStatusLabel.textContent.trim()).toBe('Completed');
    expect(firstStatusCount.textContent.trim()).toBe('10');
    // FIX: Updated expectation for the correct class
    expect(firstStatusColor.classList).toContain('bg-green-500');

    // Check content and classes for the third item ('To Do')
    const thirdStatusLabel = getByTestId('status-label-2').nativeElement;
    const thirdStatusCount = getByTestId('status-count-2').nativeElement;
    const thirdStatusColor = getByTestId('status-color-2').nativeElement;

    expect(thirdStatusLabel.textContent.trim()).toBe('To Do');
    expect(thirdStatusCount.textContent.trim()).toBe('8');
    // FIX: Updated expectation for the correct class
    expect(thirdStatusColor.classList).toContain('bg-yellow-500');
  });

  it('should initialize and render the ApexCharts in ngAfterViewInit (browser mode)', fakeAsync(() => {
    component.statuses = mockStatuses;
    fixture.detectChanges();
    tick(); // Wait for the mock import promise to resolve

    // ApexCharts should be initialized
    expect(component['chart']).toBeInstanceOf(MockApexCharts);
    // The render method should have been called
    expect(component['chart'].render).toHaveBeenCalled();
    // Check chart options series data (counts)
    expect(component['chart'].options.series).toEqual([10, 5, 8]);

    // FIX: Updated expectation to match the HEX values for 'bg-green-500', 'bg-blue-500', 'bg-yellow-500'
    expect(component['chart'].options.colors).toEqual(['#10B981', '#3B82F6', '#F59E0B']);
  }));

  it('should call updateChart on ngOnChanges when statuses change', fakeAsync(() => {
    component.statuses = mockStatuses;
    fixture.detectChanges();
    tick(); // Initialize chart

    const initialChart = component['chart'];
    expect(initialChart.updateOptions).not.toHaveBeenCalled();

    // Change input
    const newStatuses = [
      ...mockStatuses,
      // FIX: Updated new status to use a supported color class
      { label: 'Blocked', count: 2, colorClass: 'bg-red-500' },
    ];
    component.statuses = newStatuses;
    component.ngOnChanges(); // Manually call ngOnChanges for input change

    expect(initialChart.updateOptions).toHaveBeenCalledTimes(1);
    const updatedOptions = initialChart.updateOptions.calls.mostRecent().args[0];

    // Verify updated series and labels (colors will be implicitly updated to include the red hex)
    expect(updatedOptions.series).toEqual([10, 5, 8, 2]);
    expect(updatedOptions.labels).toEqual(['Completed', 'In Progress', 'To Do', 'Blocked']);
  }));

  it('should destroy the chart on ngOnDestroy', fakeAsync(() => {
    component.statuses = mockStatuses;
    fixture.detectChanges();
    tick(); // Initialize chart

    const chartDestroySpy = component['chart'].destroy;
    expect(chartDestroySpy).not.toHaveBeenCalled();

    component.ngOnDestroy();

    expect(chartDestroySpy).toHaveBeenCalledTimes(1);
  }));

  it('should return correct hex colors for known color classes', () => {
    // FIX: Updated test data to use color classes supported by the component
    const colors = component['getColors'].call({
      statuses: [
        { label: 'A', count: 1, colorClass: 'bg-green-500' },
        { label: 'B', count: 1, colorClass: 'bg-red-500' },
        { label: 'C', count: 1, colorClass: 'bg-blue-500' },
      ],
    });

    // FIX: Updated expectation to match the HEX values for 'bg-green-500', 'bg-red-500', 'bg-blue-500'
    expect(colors).toEqual(['#10B981', '#EF4444', '#3B82F6']);
  });

  it('should return default gray color for unknown color classes', () => {
    // FIX: Updated test data to use a known class ('bg-yellow-500') and an unknown one
    const colors = component['getColors'].call({
      statuses: [
        { label: 'A', count: 1, colorClass: 'bg-unknown' },
        { label: 'B', count: 1, colorClass: 'bg-yellow-500' },
      ],
    });

    // FIX: Updated expectation to match the HEX value for 'bg-yellow-500'
    expect(colors).toEqual(['#6B7280', '#F59E0B']);
  });
});
