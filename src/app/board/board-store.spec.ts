import { TestBed } from '@angular/core/testing';
import { BoardStore } from './board-store';
import { sprints, backlogIssues } from '../shared/data/dummy-backlog-data';

describe('BoardStore', () => {
  let service: BoardStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoardStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loadData should populate sprints and issues', () => {
    service.loadData(sprints);
    expect(service.sprints().length).toBeGreaterThan(0);
    expect(service.issues().length).toBeGreaterThan(0);
  });

  it('selectSprint and visibleIssues should filter by sprint', () => {
    service.loadData(sprints);
    // ensure backlog added too
    service.addBacklog(backlogIssues);

    // pick a sprint that exists in the dummy data
    const active = service.sprints().find(s => s.status === 'ACTIVE');
    if (active) {
      service.selectSprint(active.id as string);
      const visible = service.visibleIssues();
      // visible issues should all have sprintId equal to selected sprint
      expect(visible.every(i => i.sprintId === active.id)).toBeTrue();
    }
  });

  it('addBacklog should append backlog issues', () => {
    service.loadData(sprints);
    const before = service.issues().length;
    service.addBacklog(backlogIssues);
    expect(service.issues().length).toBeGreaterThanOrEqual(before + backlogIssues.length);
  });

  it('updateIssueStatus should change the status of an issue', () => {
    service.loadData(sprints);
    service.addBacklog(backlogIssues);
    const all = service.issues();
    if (!all.length) return;
    const id = all[0].id;
    const old = all.find(i => i.id === id)!.status;
    service.updateIssueStatus(id, 'DONE');
    const updated = service.issues().find(i => i.id === id)!;
    expect(updated.status).toBe('DONE');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(new Date(0).getTime());
    // restore original for isolation
    service.updateIssueStatus(id, old as any);
  });
});
