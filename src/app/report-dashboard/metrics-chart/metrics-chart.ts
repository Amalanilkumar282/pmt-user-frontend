//  // metrics-chart.component.ts
// import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
// import { sprints } from '../../shared/data/dummy-backlog-data';
// import { Issue } from '../../shared/models/issue.model';
// import { Chart, ChartConfiguration, registerables } from 'chart.js';

// @Component({
//   selector: 'app-metrics-chart',
//   templateUrl: './metrics-chart.html',
//   styleUrls: ['./metrics-chart.css'],
//   standalone: true
// })
// export class MetricsChart implements OnInit, AfterViewInit {
//   @Input() issues: Issue[] = [];
//   @ViewChild('burnupCanvas') burnupCanvas!: ElementRef<HTMLCanvasElement>;
//   chart!: Chart;

//   burnupOptions: any;

//   constructor() {
//     Chart.register(...registerables); // register Chart.js components
//   }

//   ngOnInit() {
//     // 1️⃣ Select a sprint (example: active sprint 1)
//     const sprint = sprints.find(s => s.id === 'active-1');
//     if (!sprint) return;

//     const issues: Issue[] = sprint.issues || [];

//     // 2️⃣ Build timeline from sprint start → end
//     const dates: string[] = [];
//     for (let d = new Date(sprint.startDate); d <= sprint.endDate; d.setDate(d.getDate() + 1)) {
//       dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
//     }

//     // 3️⃣ Total scope = sum of all storyPoints
//     const totalScopePoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
//     const totalScope = Array(dates.length).fill(totalScopePoints);

//     // 4️⃣ Completed Work (cumulative by date)
//     const completed: number[] = [];
//     let cumulative = 0;
//     const counted: Set<string> = new Set();

//     dates.forEach((dateStr, index) => {
//       const currentDate = new Date(sprint.startDate);
//       currentDate.setDate(new Date(sprint.startDate).getDate() + index);

//       issues.forEach(issue => {
//         if (issue.status === 'DONE' && !counted.has(issue.id)) {
//           const doneDate = new Date(issue.updatedAt);
//           if (doneDate <= currentDate) {
//             cumulative += issue.storyPoints || 0;
//             counted.add(issue.id);
//           }
//         }
//       });

//       completed.push(cumulative);
//     });

//     // 5️⃣ Prepare Chart.js config
//     this.burnupOptions = {
//       labels: dates,
//       datasets: [
//         {
//           label: 'Completed Work',
//           data: completed,
//           borderColor: 'green',
//           backgroundColor: 'rgba(0,255,0,0.2)',
//           fill: true,
//           tension: 0.4,
//           pointRadius: 5
//         },
//         {
//           label: 'Total Scope',
//           data: totalScope,
//           borderColor: 'red',
//           borderDash: [5, 5],
//           fill: false,
//           tension: 0.4,
//           pointRadius: 0
//         }
//       ]
//     };
//   }

//   ngAfterViewInit(): void {
//     if (!this.burnupCanvas) return;

//     const config: ChartConfiguration = {
//       type: 'line',
//       data: this.burnupOptions,
//       options: {
//         responsive: true,
//         plugins: {
//           title: {
//             display: true,
//             text: 'Burnup Chart'
//           },
//           legend: { position: 'bottom' }
//         },
//         scales: {
//           y: { beginAtZero: true },
//           x: { display: true }
//         }
//       }
//     };

//     this.chart = new Chart(this.burnupCanvas.nativeElement, config);
//   }
// }

// metrics-chart.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexDataLabels,
  ApexLegend,
  ApexTitleSubtitle
} from 'ng-apexcharts';

import { Issue } from '../../shared/models/issue.model';
import { sprints } from '../../shared/data/dummy-backlog-data';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
  fill: ApexFill; 
};

@Component({
  selector: 'app-metrics-chart',
  templateUrl: './metrics-chart.html',
  styleUrls: ['./metrics-chart.css'],
  standalone: true,
  imports: [CommonModule, NgApexchartsModule] // ← MUST include NgApexchartsModule
})
export class MetricsChart implements OnInit {
  @Input() issues: Issue[] = [];
  public chartOptions!: ChartOptions;
  @Input() chartType: 'burnup' | 'burndown' = 'burnup';


//   ngOnInit() {
//     const sprint = sprints.find(s => s.id === 'completed-1');
//     if (!sprint) return;

//     const issues: Issue[] = sprint.issues || [];

//     // Dates
//     const dates: string[] = [];
//     for (let d = new Date(sprint.startDate); d <= sprint.endDate; d.setDate(d.getDate() + 1)) {
//       dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
//     }

//     // Total scope
//     const totalScopePoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
//     const totalScope = Array(dates.length).fill(totalScopePoints);

//     // Completed work
//     const completed: number[] = [];
//     let cumulative = 0;
//     const counted: Set<string> = new Set();

//     dates.forEach((_, index) => {
//       const currentDate = new Date(sprint.startDate);
//       currentDate.setDate(new Date(sprint.startDate).getDate() + index);

//       issues.forEach(issue => {
//         if (issue.status === 'DONE' && !counted.has(issue.id)) {
//           const doneDate = new Date(issue.updatedAt);
//           if (doneDate <= currentDate) {
//             cumulative += issue.storyPoints || 0;
//             counted.add(issue.id);
//           }
//         }
//       });

//       completed.push(cumulative);
//     });

//     // ApexCharts config
// //      this.chartOptions = {
// //   series: [
// //     { name: 'Completed Work', data: completed },
// //     { name: 'Total Scope', data: totalScope }
// //   ],
// //   chart: { type: 'line', height: 350 },
// //   xaxis: { 
// //     categories: dates,
// //     // title: { text: 'Date' }  // ← X-axis label
// //   },
// //   yaxis: { 
// //     min: 0,
// //     title: { text: 'Story Points' }  // ← Y-axis label
// //   },
// //   stroke: { curve: 'smooth', width: 3 },
// //   dataLabels: { enabled: false },
// //   legend: { position: 'bottom' },
// //   title: { text: sprint.name + ' Burnup Chart', align: 'center' }
// // };

// this.chartOptions = {
//   series: [
//     { name: 'Completed Work', data: completed },
//     { name: 'Total Scope', data: totalScope }
//   ],
//   chart: { 
//     type: 'area',    // ← change from 'line' to 'area'
//     height: 350 ,
//      toolbar: { show: false } 
//   },
//   xaxis: { 
//     categories: dates,
//     title: { text: 'Date' },
//     tickAmount: Math.ceil(dates.length / 3),
// //      labels: {
// //   formatter: function (val, index) {
// //     // index might be undefined, fallback to 0
// //     const i = index ?? 0;
// //     return i % 3 === 0 ? val : '';
// //   }
// // }

   
//   },
//   yaxis: { 
//     min: 0,
//     title: { text: 'Story Points' }
//   },
//   stroke: { 
//     curve: 'smooth',  // ← spline effect
//     width: 3 
//   },
//   fill: { 
//     type: 'gradient', // smooth gradient for the area
//     gradient: {
//       shadeIntensity: 0.4,
//       opacityFrom: 0.6,
//       opacityTo: 0.1,
//       stops: [0, 90, 100]
//     }
//   },
//   dataLabels: { enabled: false },
//   legend: { position: 'bottom' },
//   title: { text: sprint.name + ' Burnup Chart', align: 'center' }
// };

//   }
// }

chart: any;

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy(); // cleanup
    }
  }
ngOnInit() {
  const sprint = sprints.find(s => s.id === 'completed-1');
  if (!sprint) return;

  const issues: Issue[] = sprint.issues || [];

  const dates: string[] = [];
  for (let d = new Date(sprint.startDate); d <= sprint.endDate; d.setDate(d.getDate() + 1)) {
    dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  const totalScopePoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  // Calculate cumulative completed points
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

  // For burnup vs burndown
  let series;
  if (this.chartType === 'burnup') {
    const totalScope = Array(dates.length).fill(totalScopePoints);
    series = [
      { name: 'Completed Work', data: completed },
      { name: 'Total Scope', data: totalScope }
    ];
  } else { // burndown
    const remaining = completed.map(c => totalScopePoints - c);
    series = [
      { name: 'Remaining Work', data: remaining }
    ];
  }

  this.chartOptions = {
    series,
    chart: { type: 'area', height: 350
        },
    xaxis: { 
      categories: dates, 
      // title: { text: 'Date' },
      tickAmount: Math.ceil(dates.length / 3)
    },
    yaxis: { min: 0, title: { text: 'Story Points' } },
    stroke: { curve: 'smooth', width: 3 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.6, opacityTo: 0.1, stops: [0,90,100] } },
    dataLabels: { enabled: false },
    legend: { position: 'bottom' },
    title: { text: `${sprint.name} Chart`, align: 'center' }
  };
}
}
