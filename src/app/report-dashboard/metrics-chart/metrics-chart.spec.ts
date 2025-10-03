import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsChart } from './metrics-chart';

describe('MetricsChart', () => {
  let component: MetricsChart;
  let fixture: ComponentFixture<MetricsChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricsChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetricsChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
