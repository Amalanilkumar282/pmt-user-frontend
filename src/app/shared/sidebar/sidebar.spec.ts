import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Sidebar } from './sidebar';
import { SidebarStateService } from '../services/sidebar-state.service';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;
  let sidebarStateMock: Partial<SidebarStateService>;

  beforeEach(async () => {
    // mock that matches the real service shape: exposes `isCollapsed` signal (callable)
    let collapsed = false;
    const isCollapsedSpy = jasmine.createSpy('isCollapsed').and.callFake(() => collapsed);
    sidebarStateMock = {
      isCollapsed: isCollapsedSpy,
      toggleCollapse: () => { collapsed = !collapsed; },
      setCollapsed: (c: boolean) => { collapsed = c; }
    } as any;

    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        { provide: SidebarStateService, useValue: sidebarStateMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reflect collapsed state from service via isCollapsed()', () => {
  // initial mocked value is false
  expect(component.isCollapsed()).toBeFalse();
  // set collapsed true by calling setCollapsed on the mock
  (sidebarStateMock.setCollapsed as any)(true);
  expect(component.isCollapsed()).toBeTrue();
  });

  it('toggleCollapse should call service.toggleCollapse', () => {
    const svc: any = sidebarStateMock;
    spyOn(svc, 'toggleCollapse').and.callThrough();
    component.toggleCollapse();
    expect(svc.toggleCollapse).toHaveBeenCalled();
  });

  it('setCollapsed should call service.setCollapsed', () => {
    const svc: any = sidebarStateMock;
    spyOn(svc, 'setCollapsed').and.callThrough();
    component.setCollapsed(true);
    expect(svc.setCollapsed).toHaveBeenCalledWith(true);
  });

  it('template should add collapsed class when isCollapsed() true', () => {
    // ensure collapsed
    (sidebarStateMock.setCollapsed as any)(true);
    fixture.detectChanges();
    const aside = fixture.debugElement.query(By.css('aside.sidebar'));
    expect(aside.classes['collapsed']).toBeTrue();
  });
});
