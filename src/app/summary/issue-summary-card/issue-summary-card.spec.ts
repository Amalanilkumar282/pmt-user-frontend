import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueSummaryCard } from './issue-summary-card';

describe('IssueSummaryCard', () => {
  let component: IssueSummaryCard;
  let fixture: ComponentFixture<IssueSummaryCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueSummaryCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueSummaryCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
