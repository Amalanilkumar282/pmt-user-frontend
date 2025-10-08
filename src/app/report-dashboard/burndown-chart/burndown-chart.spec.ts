 import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BurndownChart } from './burndown-chart';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { ChartHeader } from '../chart-header/chart-header';
import { MetricsChart } from '../metrics-chart/metrics-chart';
import { NgApexchartsModule } from 'ng-apexcharts';
 

describe('BurndownChart', () => {
  let component: BurndownChart;
  let fixture: ComponentFixture<BurndownChart>;
  let router: Router;
  let sidebarService: SidebarStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BurndownChart,         // standalone component
        Sidebar,
        Navbar,
        ChartHeader,
        MetricsChart,
        NgApexchartsModule,
        RouterTestingModule
      ],
      providers: [
        SidebarStateService
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BurndownChart);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    sidebarService = TestBed.inject(SidebarStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial sidebar state from SidebarStateService', () => {
    expect(component.isSidebarCollapsed).toBe(sidebarService.isCollapsed);
  });

  it('onToggleSidebar() should call sidebarStateService.toggleCollapse', () => {
  const spy = spyOn(sidebarService, 'toggleCollapse');
  component.onToggleSidebar();
  expect(spy).toHaveBeenCalled();
});


  it('navigateBack() should call router.navigate', () => {
    const spy = spyOn(router, 'navigate');
    component.navigateBack();
    expect(spy).toHaveBeenCalledWith(['/report-dashboard']);
  });

  it('issues should be initialized as empty array', () => {
    expect(component.issues).toEqual([]);
  });
  it('should render the template properly', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
    expect(compiled.querySelector('app-chart-header')).toBeTruthy();
  });

  it('should not throw error when toggleSidebar is triggered multiple times', () => {
    expect(() => {
      component.onToggleSidebar();
      component.onToggleSidebar();
    }).not.toThrow();
  });
});
