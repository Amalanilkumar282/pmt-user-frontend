import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardToolbar } from './board-toolbar';

describe('BoardToolbar', () => {
  let component: BoardToolbar;
  let fixture: ComponentFixture<BoardToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardToolbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardToolbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
