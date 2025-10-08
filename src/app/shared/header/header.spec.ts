import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';
import { SidebarStateService } from '../services/sidebar-state.service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let sidebarStateService: SidebarStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [SidebarStateService],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    sidebarStateService = TestBed.inject(SidebarStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render menu toggle button', () => {
    const menuButton = fixture.nativeElement.querySelector('button.menu-toggle');
    expect(menuButton).toBeTruthy();
  });

  it('should render breadcrumb with "Dashboard" text', () => {
    const breadcrumb = fixture.nativeElement.querySelector('.breadcrumb');
    expect(breadcrumb.textContent).toBe('Dashboard');
  });

  it('should render search box', () => {
    const searchBox = fixture.nativeElement.querySelector('.search-box');
    expect(searchBox).toBeTruthy();
  });

  it('should call toggleSidebar when menu button is clicked', () => {
    const toggleSpy = spyOn(sidebarStateService, 'toggleCollapse');
    const menuButton = fixture.nativeElement.querySelector('button.menu-toggle');

    menuButton.click();

    expect(toggleSpy).toHaveBeenCalled();
  });

  describe('Header sections', () => {
    it('should render header-left section', () => {
      const headerLeft = fixture.nativeElement.querySelector('.header-left');
      expect(headerLeft).toBeTruthy();
    });

    it('should render header-right section', () => {
      const headerRight = fixture.nativeElement.querySelector('.header-right');
      expect(headerRight).toBeTruthy();
    });
  });

  describe('Search functionality', () => {
    it('should render search icon', () => {
      const searchIcon = fixture.nativeElement.querySelector('.search-icon svg');
      expect(searchIcon).toBeTruthy();
    });

    it('should render search input', () => {
      const searchInput = fixture.nativeElement.querySelector('.search-box input');
      expect(searchInput).toBeTruthy();
    });
  });
});
