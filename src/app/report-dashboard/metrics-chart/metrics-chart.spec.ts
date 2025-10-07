import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricsChart } from './metrics-chart';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { sprints } from '../../shared/data/dummy-backlog-data';


describe('MetricsChart', () => {
  let component: MetricsChart;
  let fixture: ComponentFixture<MetricsChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricsChart,CommonModule,NgApexchartsModule]
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

  it('should initialize chartOptions in ngOnInit for burnup', () => {
    component.chartType = 'burnup';
    component.issues = sprints[0].issues || [];
    component.ngOnInit();
    expect(component.chartOptions.series.length).toBeGreaterThan(0);
    expect(component.chartOptions.chart.type).toBe('area');
  });

  it('should initialize chartOptions in ngOnInit for burndown', () => {
    component.chartType = 'burndown';
    component.issues = sprints[0].issues || [];
    component.ngOnInit();
    expect(component.chartOptions.series.length).toBe(1); // remaining work
    expect(component.chartOptions.chart.type).toBe('area');
  });

  it('should initialize chartOptions in ngOnInit for velocity', () => {
    component.chartType = 'velocity';
    component.issues = sprints[0].issues || [];
    component.ngOnInit();
    expect(component.chartOptions.series.length).toBe(1);
    expect(component.chartOptions.chart.type).toBe('bar');
    expect(component.chartOptions.colors?.length).toBe(2);
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
    expect(component.chartOptions.series.length).toBeGreaterThan(0);
  });
});
 
