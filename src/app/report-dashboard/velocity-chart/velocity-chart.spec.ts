 import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { VelocityChart } from './velocity-chart';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Router } from '@angular/router';
 
describe('VelocityChart', () => {
  let component: VelocityChart;
  let fixture: ComponentFixture<VelocityChart>;
  let sidebarStateService: SidebarStateService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VelocityChart],
      providers: [
        provideRouter([]),
        SidebarStateService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VelocityChart);
    component = fixture.componentInstance;
    sidebarStateService = TestBed.inject(SidebarStateService);
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial sidebar state from service', () => {
    expect(component.isSidebarCollapsed).toBe(sidebarStateService.isCollapsed);
  });

    it('onToggleSidebar() should call sidebarStateService.toggleCollapse', () => {
  const spy = spyOn(sidebarStateService, 'toggleCollapse');
  component.onToggleSidebar();
  expect(spy).toHaveBeenCalled();
});



  it('should navigate back to report-dashboard', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.navigateBack();
    expect(navigateSpy).toHaveBeenCalledWith(['/report-dashboard']);
  });
});
