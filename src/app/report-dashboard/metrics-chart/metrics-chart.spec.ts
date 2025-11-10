import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MetricsChart } from './metrics-chart';
import { IssueType, IssuePriority } from '../../shared/models/issue.model';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';


describe('MetricsChart', () => {
  let component: MetricsChart;
  let fixture: ComponentFixture<MetricsChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricsChart, CommonModule, NgApexchartsModule, HttpClientModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetricsChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should have default chartType as burnup', () => {
    expect(component.chartType).toBe('burnup');
  });

  const mockIssues = [
    {
      id: 'ISS-1',
      title: 'Task 1',
      type: 'STORY' as IssueType,
      status: 'DONE',
      storyPoints: 5,
      assignee: 'John',
      description: 'desc',
      priority: 'MEDIUM' as IssuePriority,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02')
    },
    {
      id: 'ISS-2',
      title: 'Task 2',
      type: 'TASK' as IssueType,
      status: 'IN_PROGRESS',
      storyPoints: 3,
      assignee: 'Jane',
      description: 'desc',
      priority: 'LOW' as IssuePriority,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-03')
    }
  ];

  it('should initialize chartOptions in ngOnInit for burnup', () => {
    component.chartType = 'burnup';
    component.issues = mockIssues;
    component.ngOnInit();
    expect(component.chartOptions).not.toBeNull();
    expect(component.chartOptions!.series.length).toBeGreaterThan(0);
    expect(component.chartOptions!.chart.type).toBe('area');
  });

  it('should initialize chartOptions in ngOnInit for burndown', () => {
    component.chartType = 'burndown';
    component.issues = mockIssues;
    component.ngOnInit();
    expect(component.chartOptions).not.toBeNull();
    expect(component.chartOptions!.series.length).toBe(1); // remaining work
    expect(component.chartOptions!.chart.type).toBe('area');
  });

  it('should initialize chartOptions in ngOnInit for velocity', () => {
    component.chartType = 'velocity';
    component.issues = mockIssues;
    component.ngOnInit();
    expect(component.chartOptions).not.toBeNull();
    expect(component.chartOptions!.series.length).toBe(1);
    expect(component.chartOptions!.chart.type).toBe('bar');
    expect(component.chartOptions!.colors?.length).toBe(2);
  });

  it('should clean up chart in ngOnDestroy', () => {
    component.chart = { destroy: jasmine.createSpy('destroy') };
    component.ngOnDestroy();
    expect(component.chart.destroy).toHaveBeenCalled();
  });

  it('should handle empty issues array gracefully', () => {
    component.chartType = 'burnup';
    component.issues = [];
    component.ngOnInit();
    expect(component.chartOptions).not.toBeNull();
    expect(component.chartOptions!.series.length).toBeGreaterThan(0);
  });
});
 
