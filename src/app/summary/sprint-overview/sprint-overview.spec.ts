import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SprintOverview } from './sprint-overview';

describe('SprintOverview', () => {
  let component: SprintOverview;
  let fixture: ComponentFixture<SprintOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SprintOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SprintOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
