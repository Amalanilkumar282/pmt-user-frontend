import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

import { Navbar } from './navbar';
import { ModalService } from '../../modal/modal-service';
import { SidebarStateService } from '../services/sidebar-state.service';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let modalSpy: Partial<ModalService>;
  let sidebarStateMock: Partial<SidebarStateService>;

  beforeEach(async () => {
    modalSpy = { open: jasmine.createSpy('open') };
    sidebarStateMock = { getCollapsed: () => false } as any;

    await TestBed.configureTestingModule({
      imports: [Navbar, RouterTestingModule],
      providers: [
        { provide: ModalService, useValue: modalSpy },
        { provide: SidebarStateService, useValue: sidebarStateMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit toggleSidebar when hamburger clicked', () => {
    spyOn(component.toggleSidebar, 'emit');
    const btn = fixture.debugElement.query(By.css('.hamburger-btn'));
    btn.triggerEventHandler('click', null);
    expect(component.toggleSidebar.emit).toHaveBeenCalled();
  });

  it('should call modalService.open when onCreate is called', () => {
    component.onCreate();
    expect((modalSpy.open as jasmine.Spy).calls.count()).toBe(1);
    const args = (modalSpy.open as jasmine.Spy).calls.mostRecent().args[0];
    expect(args.id).toBe('createIssue');
    expect(args.title).toContain('Create New Issue');
  });

  it('should call modalService.open when onShareModal is called', () => {
    component.onShareModal();
    expect((modalSpy.open as jasmine.Spy).calls.count()).toBe(1);
    const args = (modalSpy.open as jasmine.Spy).calls.mostRecent().args[0];
    expect(args.id).toBe('shareModal');
    expect(args.title).toBe('Share Project');
  });

  it('should have navTabs with Backlog active by default', () => {
    const backlog = component.navTabs.find(t => t.label === 'Backlog');
    expect(backlog).toBeDefined();
    expect(backlog!.active).toBeTrue();
  });
});
