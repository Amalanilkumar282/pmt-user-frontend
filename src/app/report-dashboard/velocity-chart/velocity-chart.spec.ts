import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VelocityChart } from './velocity-chart';

describe('VelocityChart', () => {
  let component: VelocityChart;
  let fixture: ComponentFixture<VelocityChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VelocityChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VelocityChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
