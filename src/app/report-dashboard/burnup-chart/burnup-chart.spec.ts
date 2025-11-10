import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Location } from '@angular/common';
import { BurnupChart } from './burnup-chart';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { ChartHeader } from '../chart-header/chart-header';
import { MetricsChart } from '../metrics-chart/metrics-chart';
import { NgApexchartsModule } from 'ng-apexcharts';
 

describe('BurnupChart', () => {
  let component: BurnupChart;
  let fixture: ComponentFixture<BurnupChart>;
  let router: Router;
  let sidebarService: SidebarStateService;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BurnupChart,         // standalone component
        Sidebar,
        Navbar,
        ChartHeader,
        MetricsChart,
        NgApexchartsModule,
        RouterTestingModule,
        HttpClientModule
      ],
      providers: [
        SidebarStateService
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BurnupChart);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
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


  it('navigateBack() should call location.back', () => {
    const spy = spyOn(location, 'back');
    component.navigateBack();
    expect(spy).toHaveBeenCalled();
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
