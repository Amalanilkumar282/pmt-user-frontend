import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SprintSelect } from './sprint-select';

describe('SprintSelect', () => {
  let component: SprintSelect;
  let fixture: ComponentFixture<SprintSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SprintSelect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SprintSelect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
