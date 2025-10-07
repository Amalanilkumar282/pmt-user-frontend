import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpicDetailedView } from './epic-detailed-view';

describe('EpicDetailedView', () => {
  let component: EpicDetailedView;
  let fixture: ComponentFixture<EpicDetailedView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpicDetailedView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EpicDetailedView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
