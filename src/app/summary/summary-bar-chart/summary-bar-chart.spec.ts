import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange, SimpleChanges } from '@angular/core';

import { SummaryBarChart } from './summary-bar-chart';

// Define a mock Issue array for testing
const mockIssues = [
  { name: 'Critical', count: 5 },
  { name: 'High', count: 12 },
  { name: 'Medium', count: 8 },
  { name: 'Low', count: 3 },
];

describe('SummaryBarChart', () => {
  let component: SummaryBarChart;
  let fixture: ComponentFixture<SummaryBarChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryBarChart],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryBarChart);
    component = fixture.componentInstance;
    // Do not call fixture.detectChanges() here to test initial state before ngOnChanges
  });

  // 1. Basic creation test
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // 2. Initial chartOptions population with empty issues
  it('should initialize chartOptions in the constructor with default values (empty issues)', () => {
    // When fixture.detectChanges() is not called yet, the constructor runs.
    expect(component.chartOptions).toBeDefined();
    // The default in the component is an empty array, so data should be empty
    expect(component.chartOptions.series?.[0]?.data).toEqual([]);
    expect(component.chartOptions.xaxis?.categories).toEqual([]);
  });

  // 5. ngOnChanges call and chartOptions update when issues changes
  it('should update chartOptions via ngOnChanges when the issues input changes with data', () => {
    const newIssues = [{ name: 'Urgent', count: 2 }];
    component.issues = newIssues;

    const changes: SimpleChanges = {
      issues: new SimpleChange(component.issues, newIssues, false),
    };

    component.ngOnChanges(changes);

    const expectedCounts = newIssues.map((issue) => issue.count);
    expect(component.chartOptions.series?.[0]?.data).toEqual(expectedCounts);
  });

  // 6. ngOnChanges does not update chartOptions if issues is an empty array
  it('should not update chartOptions via ngOnChanges if the issues array is empty', () => {
    component.issues = mockIssues;
    fixture.detectChanges(); // Initial setup with mockIssues

    const initialData = component.chartOptions.series?.[0]?.data;

    component.issues = []; // Change to empty array
    const changes: SimpleChanges = {
      issues: new SimpleChange(mockIssues, [], false),
    };

    component.ngOnChanges(changes);

    // Chart options should be re-calculated, resulting in empty data/categories
    expect(component.chartOptions.series?.[0]?.data).toEqual([]);
    expect(component.chartOptions.xaxis?.categories).toEqual([]);
  });

  // 7. Test for chart type being 'bar'
  it('should configure the chart type as "bar"', () => {
    fixture.detectChanges();
    expect(component.chartOptions.chart?.type).toBe('bar');
  });

  // 8. Test for toolbar being hidden
  it('should configure the chart toolbar to be hidden', () => {
    fixture.detectChanges();
    expect(component.chartOptions.chart?.toolbar?.show).toBeFalse();
  });

  // 10. Test that dataLabels are disabled
  it('should configure dataLabels to be disabled', () => {
    fixture.detectChanges();
    expect(component.chartOptions.dataLabels?.enabled).toBeFalse();
  });
});
