import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { Issue } from '../../shared/models/issue.model';
import { sprints } from '../../shared/data/dummy-backlog-data';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
import { ViewChild, AfterViewInit } from '@angular/core';
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
  styleUrls: ['./chart-table.css'],
})
export class ChartTable implements OnInit, AfterViewInit {
  @Input() type: 'burnup' | 'burndown' | 'velocity' = 'burnup';
  @Input() statusFilter?: 'DONE' | 'INCOMPLETE';
  @Input() showPaginator: boolean = true;

  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
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
  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
    }
  }
  // private loadBurnupData(): void {
  //   // Automatically pick the latest completed sprint
  //   const sprint: Sprint | undefined = sprints
  //     .filter((s: Sprint) => s.status === 'COMPLETED' || s.status === 'ACTIVE')
  //     .sort((a: Sprint, b: Sprint) => b.endDate.getTime() - a.endDate.getTime())[0];

  //   if (!sprint) return;

  //   // Filter issues completed within sprint end date
  //   const sprintIssues: Issue[] = sprint?.issues
  //     ?.filter(issue => issue.updatedAt.getTime() <= (sprint?.endDate.getTime() ?? 0)) ?? [];



  //   // Sort issues by completion date
  //   const sortedIssues: Issue[] = [...sprintIssues].sort(
  //     (a: Issue, b: Issue) => a.updatedAt.getTime() - b.updatedAt.getTime()
  //   );

  //   // Total scope (safe handling of optional storyPoints)
  //   const totalScope: number = sortedIssues.reduce(
  //     (sum: number, i: Issue) => sum + (i.storyPoints || 0),
  //     0
  //   );

  //   const chartData: BurnupRow[] = [];

  //   // Sprint Start row
  //   chartData.push({
  //     date: sprint.startDate.toISOString().split('T')[0],
  //     event: 'Sprint Start',
  //     workItem: sortedIssues.map((i: Issue) => i.id).join(', '),
  //     completed: 0,
  //     scope: totalScope,
  //   });

  //   // Group issues by updated date
  //   const issuesByDate: Record<string, Issue[]> = {};
  //   sortedIssues.forEach((issue: Issue) => {
  //     const dateStr: string = issue.updatedAt.toISOString().split('T')[0];
  //     if (!issuesByDate[dateStr]) issuesByDate[dateStr] = [];
  //     issuesByDate[dateStr].push(issue);
  //   });

  //   // Add rows for each date with cumulative completed
  //   let cumulativeCompleted: number = 0;
  //   Object.keys(issuesByDate)
  //     .sort()
  //     .forEach((date: string) => {
  //       const issues: Issue[] = issuesByDate[date];
  //       const workItems: string = issues.map((i: Issue) => i.id).join(', ');
  //       cumulativeCompleted += issues.reduce((sum: number, i: Issue) => sum + (i.storyPoints || 0), 0);

  //       chartData.push({
  //         date,
  //         event: 'Workitem Completed',
  //         workItem: workItems,
  //         completed: cumulativeCompleted,
  //         scope: totalScope,
  //       });
  //     });

  //   this.dataSource = new MatTableDataSource<BurnupRow>(chartData);
  // }

  private loadBurnupData(): void {
  // Automatically pick the latest completed or active sprint
  const sprint: Sprint | undefined = sprints
    .filter(s => s.status === 'COMPLETED' || s.status === 'ACTIVE')
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];

  if (!sprint) return;

  // Only include issues that are completed (status DONE) and updated before sprint end
  const completedIssues: Issue[] = sprint.issues
    ?.filter(issue => issue.status === 'DONE' && issue.updatedAt.getTime() <= sprint.endDate.getTime()) ?? [];

  // Sort completed issues by updated date
  const sortedIssues: Issue[] = [...completedIssues].sort(
    (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime()
  );

  // Total scope (all completed issues)
  const totalScope: number = sortedIssues.reduce(
    (sum, i) => sum + (i.storyPoints || 0),
    0
  );

  const chartData: BurnupRow[] = [];

  // Sprint Start row
  chartData.push({
    date: sprint.startDate.toISOString().split('T')[0],
    event: 'Sprint Start',
    workItem: '',
    completed: 0,
    scope: totalScope,
  });

  // Group completed issues by updated date
  const issuesByDate: Record<string, Issue[]> = {};
  sortedIssues.forEach(issue => {
    const dateStr = issue.updatedAt.toISOString().split('T')[0];
    if (!issuesByDate[dateStr]) issuesByDate[dateStr] = [];
    issuesByDate[dateStr].push(issue);
  });

  // Add rows for each date with cumulative completed
  let cumulativeCompleted = 0;
  Object.keys(issuesByDate)
    .sort()
    .forEach(date => {
      const issues = issuesByDate[date];
      const workItems = issues.map(i => i.id).join(', ');
      cumulativeCompleted += issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

      chartData.push({
        date,
        event: 'Workitem Completed',
        workItem: workItems,
        completed: cumulativeCompleted,
        scope: totalScope,
      });
    });

  this.dataSource = new MatTableDataSource<BurnupRow>(chartData);
}

   

  loadBurndownData() {
    const sprint = sprints
      .filter(s => s.status === 'COMPLETED' || s.status === 'ACTIVE')
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];

    if (!sprint?.issues) return;

    // Filter issues by updated date first
    let sprintIssues: Issue[] = sprint.issues.filter(
      i => i.updatedAt && i.updatedAt.getTime() <= sprint.endDate.getTime()
    );

    // Apply status filter before mapping to rows
    if (this.statusFilter === 'DONE') {
      sprintIssues = sprintIssues.filter(i => i.status === 'DONE');
    } else if (this.statusFilter === 'INCOMPLETE') {
      sprintIssues = sprintIssues.filter(i => i.status !== 'DONE');
    }

    // Map filtered issues to table rows
    const burndownRows: BurndownRow[] = sprintIssues.map(i => ({
      key: i.id,
      summary: i.title,
      workType: i.type,
      // epic: i.epic || 'N/A',
      epic: 'N/A',
      status: i.status,
      assignee: i.assignee || 'Undefined',
      storyPoints: i.storyPoints ?? 0
    }));

    this.dataSource = new MatTableDataSource(burndownRows);
  }

   loadVelocityData() {
  // Get the latest sprint (either ACTIVE or most recently COMPLETED)
  const latestSprint = sprints
    .filter(s => s.status === 'ACTIVE' || s.status === 'COMPLETED')
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];

  if (!latestSprint?.issues) return;

  // Total story points committed in the sprint
  const totalCommitted = latestSprint.issues.reduce(
    (sum, i) => sum + (i.storyPoints ?? 0),
    0
  );

  // Total completed story points (status === DONE)
  const completedPoints = latestSprint.issues
    .filter(i => i.status === 'DONE')
    .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  // Prepare single-row table
  const velocityRows = [
    {
      sprint: latestSprint.name,
      commitment: totalCommitted,
      completed: completedPoints
    }
  ];

  // Define table columns
  this.displayedColumns = ['sprint', 'commitment', 'completed'];
  this.dataSource = new MatTableDataSource(velocityRows);
}

}




