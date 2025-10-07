import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SprintFilterComponent } from './sprint-filter';

describe('SprintFilter', () => {
  let component: SprintFilterComponent;
  let fixture: ComponentFixture<SprintFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SprintFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SprintFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
