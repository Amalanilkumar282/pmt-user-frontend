 import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartTable } from './chart-table';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { sprints } from '../../shared/data/dummy-backlog-data';
import { Issue } from '../../shared/models/issue.model';
import { Sprint } from '../../sprint/sprint-container/sprint-container';

describe('ChartTable', () => {
  let component: ChartTable;
  let fixture: ComponentFixture<ChartTable>;

  beforeEach(async () => {
    
    await TestBed.configureTestingModule({
      imports: [ChartTable, MatTableModule, MatPaginatorModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the ChartTable component', () => {
    expect(component).toBeTruthy();
  });

  it('should have default type as "burnup" and showPaginator true', () => {
    expect(component.type).toBe('burnup');
    expect(component.showPaginator).toBeTrue();
  });

  it('should set burnup displayedColumns and call loadBurnupData', () => {
    const spy = spyOn<any>(component, 'loadBurnupData').and.callThrough();
    component.type = 'burnup';
    component.ngOnInit();
    expect(component.displayedColumns).toEqual(['date', 'event', 'workItem', 'completed', 'scope']);
    expect(spy).toHaveBeenCalled();
  });

  it('should set velocity displayedColumns and call loadVelocityData', () => {
    const spy = spyOn(component, 'loadVelocityData').and.callThrough();
    component.type = 'velocity';
    component.ngOnInit();
    expect(component.displayedColumns).toEqual(['sprint', 'commitment', 'completed']);
    expect(spy).toHaveBeenCalled();
  });

  it('should set paginator after view init', () => {
    component.dataSource = new MatTableDataSource([{ a: 1 }]);
    component.paginator = {} as any; // fake paginator
    component.ngAfterViewInit();
    expect(component.dataSource.paginator).toBe(component.paginator);
  });

  it('should populate dataSource with burnup rows when sprint exists', () => {
    const mockSprint: Sprint = {
      id: 's1',
      name: 'Sprint 1',
      status: 'COMPLETED',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-10'),
      issues: [
        {
          id: 'ISS-1',
          title: 'Task 1',
          type: 'STORY',
          status: 'DONE',
          storyPoints: 5,
          assignee: 'John',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02')
        } as Issue
      ]
    };
    (sprints as any).push(mockSprint);

    (component as any).loadBurnupData();
    expect(component.dataSource.data.length).toBeGreaterThan(0);
    expect(component.dataSource.data[0]).toEqual(
      jasmine.objectContaining({ event: 'Sprint Start' })
    );
  });

  it('should populate burndown rows for DONE status', () => {
    const mockSprint: Sprint = {
      id: 's2',
      name: 'Sprint 2',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-10'),
      issues: [
        { id: 'ISS-2', title: 'Task 2', type: 'TASK', status: 'DONE', storyPoints: 3, assignee: 'Jane', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-03') } as Issue
      ]
    };
    (sprints as any).push(mockSprint);

    component.statusFilter = 'DONE';
    (component as any).loadBurndownData();
    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].status).toBe('DONE');
  });

  it('should filter non-DONE issues when statusFilter=INCOMPLETE', () => {
    component.statusFilter = 'INCOMPLETE';
    (component as any).loadBurndownData();
    expect(component.dataSource.data.every((d: any) => d.status !== 'DONE')).toBeTrue();
  });

  it('should populate velocity rows correctly', () => {
    const mockSprint: Sprint = {
      id: 's3',
      name: 'Sprint 3',
      status: 'COMPLETED',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-10'),
      issues: [
        { id: 'ISS-4', storyPoints: 5, status: 'DONE', updatedAt: new Date('2024-02-05') } as Issue,
        { id: 'ISS-5', storyPoints: 8, status: 'TODO', updatedAt: new Date('2024-02-06') } as Issue,
      ],
    };
    (sprints as any).push(mockSprint);

    component.loadVelocityData();
    expect(component.dataSource.data.length).toBe(1);
    const row = component.dataSource.data[0];
    expect(row.completed).toBeLessThanOrEqual(row.commitment);
  });

  it('should not throw error when no sprint available in loadVelocityData', () => {
    (sprints as any).splice(0, sprints.length);
    expect(() => component.loadVelocityData()).not.toThrow();
  });

   

  it('should handle undefined dataSource in ngAfterViewInit', () => {
    component.dataSource = undefined as any;
    expect(() => component.ngAfterViewInit()).not.toThrow();
  });
});
