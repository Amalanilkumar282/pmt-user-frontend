import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueDetailedView } from './issue-detailed-view';

describe('IssueDetailedView', () => {
  let component: IssueDetailedView;
  let fixture: ComponentFixture<IssueDetailedView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueDetailedView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueDetailedView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
