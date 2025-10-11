 import { Component, OnInit, Input, OnChanges, SimpleChanges, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { Issue } from '../../shared/models/issue.model';
import { sprints } from '../../shared/data/dummy-backlog-data';
import { Sprint } from '../../sprint/sprint-container/sprint-container';

interface BurnupRow {
  date: string;
  event: string;
  workItem: string;
  completed: number;
  scope: number;
}

export interface BurndownRow {
  key: string;
  summary: string;
  workType: string;
  epic: string;
  status: string;
  assignee: string;
  storyPoints: number;
}

@Component({
  selector: 'app-chart-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule],
  templateUrl: './chart-table.html',
  styleUrls: ['./chart-table.css']
})
export class ChartTable implements OnInit, OnChanges, AfterViewInit {
  @Input() type: 'burnup' | 'burndown' | 'velocity' = 'burnup';
  @Input() statusFilter?: 'DONE' | 'INCOMPLETE';
  @Input() showPaginator: boolean = true;
  @Input() sprintId: string | null = null; // 👈 Added

  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadTableData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sprintId'] && !changes['sprintId'].firstChange) {
      this.loadTableData(); // 👈 Reload when sprintId changes
    }
  }

  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
    }
  }

  private loadTableData(): void {
    if (this.type === 'burnup') {
      this.displayedColumns = ['date', 'event', 'workItem', 'completed', 'scope'];
      this.loadBurnupData();
    } else if (this.type === 'burndown') {
      this.displayedColumns = ['key', 'summary', 'workType', 'epic', 'status', 'assignee', 'storyPoints'];
      this.loadBurndownData();
    } else if (this.type === 'velocity') {
      this.displayedColumns = ['sprint', 'commitment', 'completed'];
      this.loadVelocityData();
    }
  }

  private getSelectedSprint(): Sprint | undefined {
    if (this.sprintId && this.sprintId !== 'all') {
      return sprints.find(s => s.id === this.sprintId);
    }
    return sprints
      .filter(s => s.status === 'COMPLETED' || s.status === 'ACTIVE')
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];
  }

  private loadBurnupData(): void {
    const sprint = this.getSelectedSprint();
    if (!sprint) {
      this.dataSource = new MatTableDataSource<BurnupRow>([]);
      return;
    }

    const allIssues: Issue[] = sprint.issues ?? [];
    const completedIssues = allIssues.filter(i => i.status === 'DONE');
    const totalScope = allIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const sorted = completedIssues.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());

    const data: BurnupRow[] = [
      {
        date: sprint.startDate.toISOString().split('T')[0],
        event: 'Sprint Start',
        workItem: allIssues.map(i => i.id).join(', '),
        completed: 0,
        scope: totalScope
      }
    ];

    let cumulative = 0;
    const grouped: Record<string, Issue[]> = {};
    sorted.forEach(issue => {
      const date = issue.updatedAt.toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(issue);
    });

    Object.keys(grouped)
      .sort()
      .forEach(date => {
        const issues = grouped[date];
        cumulative += issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        data.push({
          date,
          event: 'Workitem Completed',
          workItem: issues.map(i => i.id).join(', '),
          completed: cumulative,
          scope: totalScope
        });
      });

    this.dataSource = new MatTableDataSource<BurnupRow>(data ?? []);
  }

  private loadBurndownData(): void {
    const sprint = this.getSelectedSprint();
    if (!sprint || !sprint.issues?.length) {
      this.dataSource = new MatTableDataSource<BurndownRow>([]);
      return;
    }

    let issues: Issue[] = sprint.issues;
    if (this.statusFilter === 'DONE') {
      issues = issues.filter(i => i.status === 'DONE');
    } else if (this.statusFilter === 'INCOMPLETE') {
      issues = issues.filter(i => i.status !== 'DONE');
    }

    const rows: BurndownRow[] = issues.map(i => ({
      key: i.id,
      summary: i.title,
      workType: i.type,
      epic: 'N/A',
      status: i.status,
      assignee: i.assignee || 'Undefined',
      storyPoints: i.storyPoints ?? 0
    }));

    this.dataSource = new MatTableDataSource<BurndownRow>(rows ?? []);
  }

  private loadVelocityData(): void {
    const sprint = this.getSelectedSprint();
    if (!sprint?.issues) {
      this.dataSource = new MatTableDataSource<any>([]);
      return;
    }

    const totalCommitted = sprint.issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
    const completedPoints = sprint.issues
      .filter(i => i.status === 'DONE')
      .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

    const rows = [
      {
        sprint: sprint.name,
        commitment: totalCommitted,
        completed: completedPoints
      }
    ];

    this.dataSource = new MatTableDataSource(rows ?? []);
  }
}
