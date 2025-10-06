import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryBarChart } from './summary-bar-chart';

describe('SummaryBarChart', () => {
  let component: SummaryBarChart;
  let fixture: ComponentFixture<SummaryBarChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryBarChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryBarChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
