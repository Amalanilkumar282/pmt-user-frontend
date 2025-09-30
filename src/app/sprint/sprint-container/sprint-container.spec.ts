import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SprintContainer } from './sprint-container';

describe('SprintContainer', () => {
  let component: SprintContainer;
  let fixture: ComponentFixture<SprintContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SprintContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SprintContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
