import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpicList } from './epic-list';

describe('EpicList', () => {
  let component: EpicList;
  let fixture: ComponentFixture<EpicList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpicList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EpicList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
