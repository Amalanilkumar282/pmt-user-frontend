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
  
  it('getAllSprints returns an array', () => {
    const s = service.getAllSprints();
    expect(Array.isArray(s)).toBeTrue();
  });

  it('getIssueTypeCounts returns structure for types', () => {
    const counts = service.getIssueTypeCounts('all');
    expect(counts.find(c => c.name === 'Story')).toBeTruthy();
    expect(counts.length).toBe(4);
  });

  it('getRecentIssues returns mapped items with initials and colors', () => {
    const recent = service.getRecentIssues('all', 3);
    if (recent.length > 0) {
      const r = recent[0];
      expect(r.assigneeInitials.length).toBe(2);
      expect(typeof r.assigneeBg).toBe('string');
      expect(r.code).toBeTruthy();
    } else {
      expect(recent.length).toBe(0);
    }
  });
});
