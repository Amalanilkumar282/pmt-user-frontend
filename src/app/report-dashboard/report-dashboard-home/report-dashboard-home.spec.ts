import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Router } from '@angular/router';
import { ReportDashboardHome } from './report-dashboard-home';
import { provideRouter } from '@angular/router';

describe('ReportDashboardHome', () => {
  let component: ReportDashboardHome;
  let fixture: ComponentFixture<ReportDashboardHome>;
   let sidebarStateService: SidebarStateService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportDashboardHome ],
      providers: [
        SidebarStateService,
    provideRouter([]) // ✅ sets up router providers like ActivatedRoute
  ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportDashboardHome);
    component = fixture.componentInstance;
    sidebarStateService = TestBed.inject(SidebarStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
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
it('should not throw error when toggleSidebar is triggered multiple times', () => {
    expect(() => {
      component.onToggleSidebar();
      component.onToggleSidebar();
    }).not.toThrow();
  });

});
