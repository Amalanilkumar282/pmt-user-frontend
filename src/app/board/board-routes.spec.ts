import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BOARD_ROUTES } from './board.routes';
import { BoardPage } from './components/board-page/board-page';

describe('BOARD_ROUTES', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(BOARD_ROUTES)]
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  it('maps "" to BoardPage', () => {
    const root = BOARD_ROUTES.find((r: any) => r.path === '');
    expect(root?.component).toBe(BoardPage as any);
  });
});
