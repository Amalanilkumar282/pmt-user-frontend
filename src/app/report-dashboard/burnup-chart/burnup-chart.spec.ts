import { ComponentFixture, TestBed } from '@angular/core/testing';
 import { provideRouter } from '@angular/router';
import { BurnupChart } from './burnup-chart';

describe('BurnupChart', () => {
  let component: BurnupChart;
  let fixture: ComponentFixture<BurnupChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BurnupChart],
      providers: [
    provideRouter([])  
  ]
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
