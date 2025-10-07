import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChanges } from '@angular/core';

import { SummaryBarChart } from './summary-bar-chart';

describe('SummaryBarChart', () => {
  let component: SummaryBarChart;
  let fixture: ComponentFixture<SummaryBarChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SummaryBarChart] }).compileComponents();
    fixture = TestBed.createComponent(SummaryBarChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('initial chartOptions contains empty series when no issues', () => {
    expect(component.chartOptions).toBeTruthy();
    const series = (component.chartOptions as any).series;
    expect(Array.isArray(series)).toBeTrue();
    expect((series[0]?.data || []).length).toBe(0);
  });

  it('ngOnChanges updates chartOptions when issues provided', () => {
    component.issues = [
      { name: 'Story', count: 3 },
      { name: 'Bug', count: 1 },
    ];
    const changes: SimpleChanges = { issues: { previousValue: [], currentValue: component.issues, firstChange: false, isFirstChange: () => false } } as any;
    component.ngOnChanges(changes);
    const series = (component.chartOptions as any).series;
    expect(series[0].data).toEqual([3, 1]);
    expect((component.chartOptions as any).xaxis.categories).toEqual(['Story', 'Bug']);
    // colors should match number of issues
    expect((component.chartOptions as any).colors.length).toBe(2);
  });
});
