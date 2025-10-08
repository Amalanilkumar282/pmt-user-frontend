import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TimelineComponent } from './timeline-component';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { TimelineChart } from '../timeline-chart/timeline-chart';
import { signal } from '@angular/core';

describe('TimelineComponent', () => {
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;
  let sidebarStateService: jasmine.SpyObj<SidebarStateService>;

  beforeEach(async () => {
    // Create a mock SidebarStateService with spy methods
    const sidebarServiceSpy = jasmine.createSpyObj('SidebarStateService', 
      ['toggleCollapse'], 
      { isCollapsed: signal(false) } // Mock the isCollapsed signal
    );

    await TestBed.configureTestingModule({
      imports: [
        TimelineComponent, 
        RouterTestingModule,
        Navbar,
        Sidebar,
        TimelineChart
      ],
      providers: [
        { provide: SidebarStateService, useValue: sidebarServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    sidebarStateService = TestBed.inject(SidebarStateService) as jasmine.SpyObj<SidebarStateService>;
    fixture.detectChanges();
  });

 
  it('should create the component', () => {
    // This test verifies that the TimelineComponent is created successfully
    expect(component).toBeTruthy();
  });


  it('should inject SidebarStateService and access isCollapsed signal', () => {
    // This test checks that the sidebar state service is properly injected
    // and the component can access the isCollapsed signal
    expect(component.isSidebarCollapsed).toBeDefined();
    expect(component.isSidebarCollapsed()).toBe(false); // Initial state should be false (expanded)
  });


  it('should call toggleCollapse on sidebar service when onToggleSidebar is invoked', () => {
    // This test verifies that clicking the toggle button calls the service method
    component.onToggleSidebar();
    
    // Check that the service's toggleCollapse method was called
    expect(sidebarStateService.toggleCollapse).toHaveBeenCalled();
    expect(sidebarStateService.toggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple toggle calls correctly', () => {
    // This test verifies that the toggle can be called multiple times
    
    // Call toggle multiple times
    component.onToggleSidebar();
    component.onToggleSidebar();
    component.onToggleSidebar();
    
    // Verify the service method was called 3 times
    expect(sidebarStateService.toggleCollapse).toHaveBeenCalledTimes(3);
  });
});