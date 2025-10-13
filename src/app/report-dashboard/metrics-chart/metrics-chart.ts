import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Issue } from '../../shared/models/issue.model';
import { sprints } from '../../shared/data/dummy-backlog-data';
import { NgApexchartsModule } from 'ng-apexcharts';
 import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexPlotOptions,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexLegend,
  ApexFill,
  ApexStroke
} from "ng-apexcharts";

type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  title: ApexTitleSubtitle;
  legend: ApexLegend;
  stroke: ApexStroke;
  fill: ApexFill;
  colors?: string[];
};


@Component({
  selector: 'app-metrics-chart',
  templateUrl: './metrics-chart.html',
  styleUrls: ['./metrics-chart.css'],
  standalone: true,
  imports: [CommonModule, NgApexchartsModule]
})
export class MetricsChart implements OnInit {
  @Input() issues: Issue[] = [];

  @Input() sprintId: string | null = null;

  public chartOptions!: ChartOptions;
  @Input() chartType: 'burnup' | 'burndown' | 'velocity' = 'burnup';



   
  chart: any;

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy(); // cleanup
    }
  }

  ngOnInit() {
  this.buildChart();
}

ngOnChanges() {
  // Whenever sprintId changes, rebuild chart
  this.buildChart();
}


//  ngOnInit() {
//   const today = new Date();

//   // Try to find ongoing sprint first
//   let sprint = sprints.find(s =>
//     new Date(s.startDate) <= today && today <= new Date(s.endDate)
//   );

//   // If no ongoing sprint, pick the most recently completed one
//   if (!sprint) {
//     const completedSprints = sprints
//       .filter(s => new Date(s.endDate) < today)
//       .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
//     sprint = completedSprints[0];
//   }

//   if (!sprint) {
//     console.warn('No ongoing or recently completed sprint found.');
//     return;
//   }

//   const issues: Issue[] = sprint.issues || [];
//   const totalScopePoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

//   // Prepare date labels
//   const dates: string[] = [];
//   for (
//     let d = new Date(sprint.startDate);
//     d <= new Date(sprint.endDate);
//     d.setDate(d.getDate() + 1)
//   ) {
//     dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
//   }

//   // Compute cumulative completed points
//   const completed: number[] = [];
//   let cumulative = 0;
//   const counted: Set<string> = new Set();

//   dates.forEach((_, index) => {
//     const currentDate = new Date(sprint.startDate);
//     currentDate.setDate(new Date(sprint.startDate).getDate() + index);

//     issues.forEach(issue => {
//       if (issue.status === 'DONE' && !counted.has(issue.id)) {
//         const doneDate = new Date(issue.updatedAt);
//         if (doneDate <= currentDate) {
//           cumulative += issue.storyPoints || 0;
//           counted.add(issue.id);
//         }
//       }
//     });

//     completed.push(cumulative);
//   });

//   const completedPoints = completed[completed.length - 1] || 0;

 
//   let series: ApexAxisChartSeries = [];
//   let chartType: 'area' | 'bar' = 'area';
//   let categories: string[] = dates;
//   let plotOptions: ApexPlotOptions = {} as ApexPlotOptions;
//   let colors: string[] | undefined = undefined;

//   // Configure chart depending on type
//   if (this.chartType === 'burnup') {
//     const totalScope = Array(dates.length).fill(totalScopePoints);
//     series = [
//       { name: 'Completed Work', data: completed },
//       { name: 'Total Scope', data: totalScope }
//     ];
//     chartType = 'area';
//   } else if (this.chartType === 'burndown') {
//     const remaining = completed.map(c => totalScopePoints - c);
//     series = [{ name: 'Remaining Work', data: remaining }];
//     chartType = 'area';
//   } else if (this.chartType === 'velocity') {
//     chartType = 'bar';
//     categories = ['Total Story Points', 'Completed Story Points'];
//     series = [{ name: 'Story Points', data: [totalScopePoints, completedPoints] }];

//     plotOptions = {
//       bar: {
//         horizontal: false,
//         distributed: true,     
//         columnWidth: '40%',    
//         // borderRadius: 6,
//         // dataLabels: { position: 'top' }
//       }
//     };

//     colors = ['#4A90E2', '#2ECC71'];  
//   }

//   // Assign final chartOptions
//   this.chartOptions = {
//     series,
//     chart: { type: chartType, height: 350 },
//     plotOptions,
//     colors,
//     xaxis: { categories, tickAmount: chartType === 'bar' ? undefined : Math.ceil(dates.length / 3) },
//     yaxis: { min: 0, title: { text: 'Story Points' } },
//     stroke: { curve: 'smooth', width: 3 },
//     fill: chartType === 'bar' ? { type: 'solid' } : { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.6, opacityTo: 0.1, stops: [0, 90, 100] } },
//     dataLabels: { enabled:false },
//     legend: { show: false },
//     title: { text: `${sprint.name} ${this.chartType.charAt(0).toUpperCase() + this.chartType.slice(1)} Chart`, align: 'center' }
//   } as ChartOptions;
// }


private buildChart(): void {
  const today = new Date();

  // Pick sprint based on passed sprintId
  let sprint = this.sprintId && this.sprintId !== 'all'
    ? sprints.find(s => s.id === this.sprintId)
    : sprints.find(s => new Date(s.startDate) <= today && today <= new Date(s.endDate));

  // Fallback if no sprint found
  if (!sprint) {
    const completedSprints = sprints
      .filter(s => new Date(s.endDate) < today)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    sprint = completedSprints[0];
  }

  if (!sprint) {
    console.warn('No sprint data found.');
    return;
  }

  const issues: Issue[] = sprint.issues || [];
  const totalScopePoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  const dates: string[] = [];
  for (
    let d = new Date(sprint.startDate);
    d <= new Date(sprint.endDate);
    d.setDate(d.getDate() + 1)
  ) {
    dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  const completed: number[] = [];
  let cumulative = 0;
  const counted: Set<string> = new Set();

  dates.forEach((_, index) => {
    const currentDate = new Date(sprint.startDate);
    currentDate.setDate(new Date(sprint.startDate).getDate() + index);

    issues.forEach(issue => {
      if (issue.status === 'DONE' && !counted.has(issue.id)) {
        const doneDate = new Date(issue.updatedAt);
        if (doneDate <= currentDate) {
          cumulative += issue.storyPoints || 0;
          counted.add(issue.id);
        }
      }
    });

    completed.push(cumulative);
  });

  const completedPoints = completed[completed.length - 1] || 0;

  let series: ApexAxisChartSeries = [];
  let chartType: 'area' | 'bar' = 'area';
  let categories: string[] = dates;
  let plotOptions: ApexPlotOptions = {} as ApexPlotOptions;
  let colors: string[] | undefined = undefined;

  if (this.chartType === 'burnup') {
    const totalScope = Array(dates.length).fill(totalScopePoints);
    series = [
      { name: 'Completed Work', data: completed },
      { name: 'Total Scope', data: totalScope }
    ];
  } else if (this.chartType === 'burndown') {
    const remaining = completed.map(c => totalScopePoints - c);
    series = [{ name: 'Remaining Work', data: remaining }];
  } else if (this.chartType === 'velocity') {
    chartType = 'bar';
    categories = ['Total Story Points', 'Completed Story Points'];
    series = [{ name: 'Story Points', data: [totalScopePoints, completedPoints] }];
    plotOptions = {
      bar: { horizontal: false, distributed: true, columnWidth: '40%' }
    };
    colors = ['#4A90E2', '#2ECC71'];
  }

  this.chartOptions = {
    series,
    chart: { type: chartType, height: 350 },
    plotOptions,
    colors,
    xaxis: { categories },
    yaxis: { min: 0, title: { text: 'Story Points' } },
    stroke: { curve: 'smooth', width: 3 },
    fill: chartType === 'bar'
      ? { type: 'solid' }
      : { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.6, opacityTo: 0.1, stops: [0, 90, 100] } },
    dataLabels: { enabled: false },
    legend: { show: false },
    title: { text: `${sprint.name} ${this.chartType.toUpperCase()} Chart`, align: 'center' }
  } as ChartOptions;
}

}
