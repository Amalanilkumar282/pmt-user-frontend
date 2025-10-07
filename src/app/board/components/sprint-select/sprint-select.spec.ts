import { TestBed } from '@angular/core/testing';
import { SprintSelect } from './sprint-select';
import type { Sprint } from '../../models';

describe('SprintSelect', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SprintSelect]
    }).compileComponents();
  });

  it('getCurrentLabel returns Backlog or sprint name (+Current for ACTIVE)', () => {
    const fixture = TestBed.createComponent(SprintSelect);
    const cmp = fixture.componentInstance;
    const sprints: Sprint[] = [
      { id:'s1', name:'S1', startDate:new Date(), endDate:new Date(), status:'ACTIVE', issues:[] },
      { id:'s2', name:'S2', startDate:new Date(), endDate:new Date(), status:'PLANNED', issues:[] }
    ];
    cmp.sprints = sprints;

    cmp.selectedId = 'BACKLOG';
    expect(cmp.getCurrentLabel()).toBe('Backlog');

    cmp.selectedId = 's1';
    expect(cmp.getCurrentLabel()).toBe('S1 - Current');

    cmp.selectedId = 's2';
    expect(cmp.getCurrentLabel()).toBe('S2');

    cmp.selectedId = 'unknown';
    expect(cmp.getCurrentLabel()).toBe('Select Sprint');
  });

  it('label formats ACTIVE with " - Current"', () => {
    const fixture = TestBed.createComponent(SprintSelect);
    const cmp = fixture.componentInstance;
    const s: Sprint = { id:'x', name:'June', startDate: new Date(), endDate: new Date(), status:'ACTIVE', issues:[] };
    expect(cmp.label(s)).toBe('June - Current');
  });

  it('selectSprint emits and closes', () => {
    const fixture = TestBed.createComponent(SprintSelect);
    const cmp = fixture.componentInstance;
    spyOn(cmp.select, 'emit');
    cmp.open = true;
    cmp.selectSprint('s3');
    expect(cmp.select.emit).toHaveBeenCalledWith('s3');
    expect(cmp.open).toBeFalse();
  });

  it('selectedRange formats dates', () => {
    const fixture = TestBed.createComponent(SprintSelect);
    const cmp = fixture.componentInstance;
    const sd = new Date(2024, 0, 1);
    const ed = new Date(2024, 0, 15);
    cmp.sprints = [{ id:'s1', name:'S1', startDate: sd, endDate: ed, status:'PLANNED', issues:[] }];
    cmp.selectedId = 's1';
    const text = cmp.selectedRange;
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });
});
