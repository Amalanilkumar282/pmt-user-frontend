import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BacklogContainer } from './backlog-container';

describe('BacklogContainer', () => {
  let component: BacklogContainer;
  let fixture: ComponentFixture<BacklogContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BacklogContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BacklogContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
