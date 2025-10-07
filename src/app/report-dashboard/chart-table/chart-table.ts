 import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Issue} from '../../shared/models/issue.model';
import { sprints } from '../../shared/data/dummy-backlog-data';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
interface BurnupRow {
  date: string;
  event: string;
  workItem: string;
  completed: number;
  scope: number;
}

@Component({
  selector: 'app-chart-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule],
  templateUrl: './chart-table.html',
  styleUrls: ['./chart-table.css'],
})
export class ChartTable implements OnInit {
  dataSource!: MatTableDataSource<BurnupRow>;
  displayedColumns: string[] = ['date', 'event', 'workItem', 'scope', 'completed'];

  ngOnInit(): void {
    this.generateBurnupTable();
  }

  private generateBurnupTable(): void {
    // Automatically pick the latest completed sprint
    const sprint: Sprint | undefined = sprints
      .filter((s: Sprint) => s.status === 'COMPLETED' || s.status === 'ACTIVE')
      .sort((a: Sprint, b: Sprint) => b.endDate.getTime() - a.endDate.getTime())[0];

    if (!sprint) return;

    // Filter issues completed within sprint end date
 const sprintIssues: Issue[] = sprint?.issues
  ?.filter(issue => issue.updatedAt.getTime() <= (sprint?.endDate.getTime() ?? 0)) ?? [];



    // Sort issues by completion date
    const sortedIssues: Issue[] = [...sprintIssues].sort(
      (a: Issue, b: Issue) => a.updatedAt.getTime() - b.updatedAt.getTime()
    );

    // Total scope (safe handling of optional storyPoints)
    const totalScope: number = sortedIssues.reduce(
      (sum: number, i: Issue) => sum + (i.storyPoints || 0),
      0
    );

    const chartData: BurnupRow[] = [];

    // Sprint Start row
    chartData.push({
      date: sprint.startDate.toISOString().split('T')[0],
      event: 'Sprint Start',
      workItem: sortedIssues.map((i: Issue) => i.id).join(', '),
      completed: 0,
      scope: totalScope,
    });

    // Group issues by updated date
    const issuesByDate: Record<string, Issue[]> = {};
    sortedIssues.forEach((issue: Issue) => {
      const dateStr: string = issue.updatedAt.toISOString().split('T')[0];
      if (!issuesByDate[dateStr]) issuesByDate[dateStr] = [];
      issuesByDate[dateStr].push(issue);
    });

    // Add rows for each date with cumulative completed
    let cumulativeCompleted: number = 0;
    Object.keys(issuesByDate)
      .sort()
      .forEach((date: string) => {
        const issues: Issue[] = issuesByDate[date];
        const workItems: string = issues.map((i: Issue) => i.id).join(', ');
        cumulativeCompleted += issues.reduce((sum: number, i: Issue) => sum + (i.storyPoints || 0), 0);

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
}
