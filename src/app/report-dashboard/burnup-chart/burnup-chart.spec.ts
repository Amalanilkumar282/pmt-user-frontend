import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BurnupChart } from './burnup-chart';

describe('BurnupChart', () => {
  let component: BurnupChart;
  let fixture: ComponentFixture<BurnupChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BurnupChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BurnupChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
