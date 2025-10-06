import { TestBed } from '@angular/core/testing';

import { IssueSummaryService } from './issue-summary.service';

describe('IssueSummaryService', () => {
  let service: IssueSummaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IssueSummaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
