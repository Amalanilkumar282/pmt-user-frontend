import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardColumnsContainer } from './board-columns-container';

describe('BoardColumnsContainer', () => {
  let component: BoardColumnsContainer;
  let fixture: ComponentFixture<BoardColumnsContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardColumnsContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardColumnsContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
