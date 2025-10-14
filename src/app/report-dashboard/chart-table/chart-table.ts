 import { Component, OnInit, Input, OnChanges, SimpleChanges, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { Issue } from '../../shared/models/issue.model';
import { sprints } from '../../shared/data/dummy-backlog-data';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
import { MatTooltipModule } from '@angular/material/tooltip';

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
  imports: [CommonModule, MatTableModule, MatPaginatorModule,MatTooltipModule],
  templateUrl: './chart-table.html',
  styleUrls: ['./chart-table.css']
})
export class ChartTable implements OnInit, OnChanges, AfterViewInit {
  @Input() type: 'burnup' | 'burndown' | 'velocity' = 'burnup';
  @Input() statusFilter?: 'DONE' | 'INCOMPLETE'|'OUT_OF_SPRINT';
 
  @Input() sprintId: string | null = null;

  dataSource!: MatTableDataSource<any> ;
  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadTableData();
    
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sprintId'] && !changes['sprintId'].firstChange) {
      this.loadTableData();
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
    if (data.length > 5) {
      this.dataSource.paginator = this.paginator;
    } else {
      this.dataSource.paginator = null;
    }
  }

  private loadBurndownData(): void {
    const sprint = this.getSelectedSprint();
    if (!sprint || !sprint.issues?.length) {
      this.dataSource = new MatTableDataSource<BurndownRow>([]);
      return;
    }

    const sprintEndDate = new Date(sprint.endDate);
    let issues: Issue[] = sprint.issues;

    if (this.statusFilter === 'DONE') {
      issues = issues.filter(i => 
        i.status === 'DONE' && new Date(i.updatedAt) <= sprintEndDate
      );
    } else if (this.statusFilter === 'INCOMPLETE') {
      issues = issues.filter(i => i.status !== 'DONE');
    } else if (this.statusFilter === 'OUT_OF_SPRINT') {
      issues = issues.filter(i => 
        i.status === 'DONE' && new Date(i.updatedAt) > sprintEndDate
      );
    }

    const rows: BurndownRow[] = issues.map(i => ({
      key: i.id,
      summary: i.title,
      workType: i.type,
      epic:  i.epicId || '',
      status: i.status,
      assignee: i.assignee || 'Undefined',
      storyPoints: i.storyPoints ?? 0
    }));

    this.dataSource = new MatTableDataSource<BurndownRow>(rows ?? []);

    if (rows.length > 5) {
      this.dataSource.paginator = this.paginator;
    } else {
      this.dataSource.paginator = null;
    }
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

  getEmptyMessage(): string {
    switch (this.statusFilter) {
      case 'DONE':
        return 'No work items have been completed within the sprint';
      case 'OUT_OF_SPRINT':
        return 'No work items have been completed outside of the sprint';
      case 'INCOMPLETE':
        return 'No incomplete work items';
      default:
        return 'No work items available';
    }
  }

  // 👈 Add this helper method
  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Filter out already-defined columns for dynamic rendering
  getOtherColumns(): string[] {
    const defined = ['key', 'summary', 'workType', 'epic', 'status', 'assignee', 'storyPoints'];
    return this.displayedColumns.filter(col => !defined.includes(col));
  }

   

// To keep track of assigned colors for each value
assignedColors: { [key: string]: string } = {};


// Predefined colors for common statuses
predefinedStatusColors: { [key: string]: string } = {
  'done': '#10b981',          // green
  'todo': '#A1C4FD',   // blue
  'in progress': '#ffa500',         // orange
  'on hold': '#EF4444',       // purple
  'in review': '#A78bfa'      // teal
};


// { id: 'TODO',        title: 'To Do',        color: '#A1C4FD' },  
//   { id: 'IN_PROGRESS', title: 'In Progress',  color: '#FFA500' },  
//   { id: 'BLOCKED',     title: 'Blocked',      color: '#EF4444' },  
//   { id: 'IN_REVIEW',   title: 'In Review',    color: '#A78BFA' },  
//   { id: 'DONE',        title: 'Done',         color: '#10B981' },  

colorPalette: string[] = [
  
    '#795548', '#607d8b', '#e91e63', '#3f51b5',
  '#00bcd4', '#8bc34a', '#ff5722', '#673ab7', '#cddc39',
  '#ffeb3b', '#f06292', '#64b5f6', '#4db6ac', '#ba68c8'
];

 getStatusColor(value: string): string {
  if (!value) return '#ccc';

  const key = value.toLowerCase().replace(/_/g, ' ');

  // 1️⃣ Check if predefined
  if (this.predefinedStatusColors[key]) {
    return this.predefinedStatusColors[key];
  }

  // 2️⃣ Check if already assigned dynamically
  if (this.assignedColors[key]) {
    return this.assignedColors[key];
  }

  // 3️⃣ Assign next available color from palette
  const usedColors = Object.values(this.assignedColors);
  const availableColors = this.colorPalette.filter(c => !usedColors.includes(c));

  let color: string;
  if (availableColors.length > 0) {
    color = availableColors[0]; // pick first unused
  } else {
    // if all used, fallback to hash
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    color = this.colorPalette[Math.abs(hash) % this.colorPalette.length];
  }

  this.assignedColors[key] = color; // save dynamically
  return color;
}



}