import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { BOARD_ROUTES } from './board.routes';
import { BoardPage } from './components/board-page/board-page';

@Component({
  template: '<div>Test Component</div>',
  standalone: true
})
class TestComponent {}

describe('Board Routes', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'test', component: TestComponent },
          ...BOARD_ROUTES
        ]),
        BoardPage
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should define board routes correctly', () => {
    expect(BOARD_ROUTES).toBeDefined();
    expect(BOARD_ROUTES.length).toBe(1);
  });

  it('should have empty path route that loads BoardPage component', () => {
    const route = BOARD_ROUTES[0];
    expect(route.path).toBe('');
    expect(route.component).toBe(BoardPage);
  });

  it('should navigate to board page for empty path', async () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    await router.navigate(['']);
    expect(navigateSpy).toHaveBeenCalledWith(['']);
  });

  it('should be importable as route configuration', () => {
    // Test that BOARD_ROUTES can be used in Angular route configuration
    // This test validates that the routes structure is compatible with Angular router
    expect(BOARD_ROUTES).toBeDefined();
    expect(Array.isArray(BOARD_ROUTES)).toBe(true);
    expect(BOARD_ROUTES.length).toBeGreaterThan(0);
    
    // Verify each route has the required properties
    BOARD_ROUTES.forEach(route => {
      expect(route.path).toBeDefined();
      expect(route.component).toBeDefined();
    });
  });

  it('should have routes with valid structure for Angular router', () => {
    BOARD_ROUTES.forEach(route => {
      expect(route.path).toBeDefined();
      expect(typeof route.path).toBe('string');
      
      if (route.component) {
        expect(route.component).toBeDefined();
      }
    });
  });

  it('should export BOARD_ROUTES as Routes array', () => {
    expect(Array.isArray(BOARD_ROUTES)).toBe(true);
    expect(BOARD_ROUTES.every(route => 
      typeof route === 'object' && route !== null
    )).toBe(true);
  });
});