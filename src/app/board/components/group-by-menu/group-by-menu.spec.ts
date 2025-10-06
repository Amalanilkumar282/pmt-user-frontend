import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupByMenu } from './group-by-menu';

describe('GroupByMenu', () => {
  let component: GroupByMenu;
  let fixture: ComponentFixture<GroupByMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupByMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupByMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
