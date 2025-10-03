import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BurndownChart } from './burndown-chart';

describe('BurndownChart', () => {
  let component: BurndownChart;
  let fixture: ComponentFixture<BurndownChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BurndownChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BurndownChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
