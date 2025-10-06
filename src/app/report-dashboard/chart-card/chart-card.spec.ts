import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ChartCard } from './chart-card';

describe('ChartCard', () => {
  let component: ChartCard;
  let fixture: ComponentFixture<ChartCard>;
   let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
     routerSpy = jasmine.createSpyObj('Router', ['navigate']); 
    await TestBed.configureTestingModule({
      imports: [ChartCard],
      providers: [{ provide: Router, useValue: routerSpy }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

   // ✅ 2. Should generate default data when empty
  it('should generate default data on init when no data is provided', () => {
    component.data = [];
    component.chartType = 'burnup';
    component.ngOnInit();
    expect(component.data.length).toBeGreaterThan(0);
  });

  // ✅ 3. Should return line path for burnup
  it('should return a valid line path for burnup chart', () => {
    component.chartType = 'burnup';
    component.data = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 }
    ];
    const path = component.linePath;
    expect(path.startsWith('M')).toBeTrue();
  });

  // ✅ 4. Should invert values for burndown normalization
  it('should invert normalized y values for burndown chart', () => {
    const data = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 }
    ];
    component.chartType = 'burndown';
    const normalized = (component as any).normalizeData(data);
    expect(normalized[0].y).toBeGreaterThan(normalized[2].y); // inverted trend
  });

  // ✅ 5. Should compute correct velocity bars
  it('should compute velocity bars correctly', () => {
    component.chartType = 'velocity';
    component.data = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 }
    ];
    const bars = component.velocityBars;
    expect(bars.length).toBe(3);
    expect(bars[0].width).toBeGreaterThan(0);
    expect(bars[0].height).toBeGreaterThan(0);
  });

  // ✅ 6. Should navigate when goToDetails() is called
  it('should call router.navigate with detailsLink', () => {
    component.detailsLink = '/details';
    component.goToDetails();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/details']);
  });

  // ✅ 7. Should not navigate if detailsLink is falsy
  it('should not navigate if detailsLink is empty', () => {
    component.detailsLink = '';
    component.goToDetails();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
