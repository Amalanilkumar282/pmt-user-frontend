import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpicContainer } from './epic-container';

describe('EpicContainer', () => {
  let component: EpicContainer;
  let fixture: ComponentFixture<EpicContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpicContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EpicContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
