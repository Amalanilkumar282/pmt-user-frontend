import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

import { Navbar } from './navbar';
import { ModalService } from '../../modal/modal-service';
import { SidebarStateService } from '../services/sidebar-state.service';
import { ProjectContextService } from '../services/project-context.service';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let modalSpy: Partial<ModalService>;
  let sidebarStateMock: Partial<SidebarStateService>;
  let projectContextMock: Partial<any>;

  beforeEach(async () => {
  modalSpy = { open: jasmine.createSpy('open') };
  sidebarStateMock = { isCollapsed: false } as any;
  projectContextMock = { currentProjectId: () => '1' } as any;

    await TestBed.configureTestingModule({
      imports: [Navbar, RouterTestingModule],
      providers: [
        { provide: ModalService, useValue: modalSpy },
        { provide: SidebarStateService, useValue: sidebarStateMock },
        { provide: ProjectContextService as any, useValue: projectContextMock }
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

  it('should call modalService.open when handleOpenCreateModal is called', () => {
    component.handleOpenCreateModal({});
    expect((modalSpy.open as jasmine.Spy).calls.count()).toBe(1);
    const args = (modalSpy.open as jasmine.Spy).calls.mostRecent().args[0];
    expect(args.id).toBe('create-issue');
    expect(args.title).toContain('Create Issue');
  });

  it('should render a Backlog link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backlogLink = Array.from(compiled.querySelectorAll('a')).find(a => a.textContent?.trim() === 'Backlog');
    expect(backlogLink).toBeTruthy();
  });
});
