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
  public chartOptions!: ChartOptions;
  @Input() chartType: 'burnup' | 'burndown' | 'velocity' = 'burnup';



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
//  ngOnInit() {
//   const sprint = sprints.find(s => s.id === 'completed-1');
//   if (!sprint) return;

//   const issues: Issue[] = sprint.issues || [];
//   const totalScopePoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

//   // 🟩 Prepare dates
//   const dates: string[] = [];
//   for (let d = new Date(sprint.startDate); d <= sprint.endDate; d.setDate(d.getDate() + 1)) {
//     dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
//   }

//   // 🟩 Calculate cumulative completed points
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

//   // 🟩 Chart configuration
//   let series: ApexAxisChartSeries = [];
//   let chartType: 'area' | 'bar' = 'area';
//   let categories: string[] = dates;

//   if (this.chartType === 'burnup') {
//     const totalScope = Array(dates.length).fill(totalScopePoints);
//     series = [
//       { name: 'Completed Work', data: completed },
//       { name: 'Total Scope', data: totalScope }
//     ];
//   } else if (this.chartType === 'burndown') {
//     const remaining = completed.map(c => totalScopePoints - c);
//     series = [{ name: 'Remaining Work', data: remaining }];
//   } else  if (this.chartType === 'velocity') {
//   chartType = 'bar';
//   categories = ['Total Story Points', 'Completed Story Points'];

//   // Data is just numbers
//   series = [
//     { name: 'Story Points', data: [totalScopePoints, completedPoints] }
//   ];

//   // Top-level colors applied per bar because distributed: true
//   this.chartOptions = {
//     series,
//     chart: { type: 'bar', height: 350 },
//     plotOptions: {
//       bar: {
//         horizontal: false,
//         distributed: true,
//         columnWidth: '40%',
//         // borderRadius: 6,
//         // dataLabels: { position: 'top' }
//       }
//     },
//     colors: ['#4A90E2', '#2ECC71'], // ✅ different color per bar
//     xaxis: { categories ,title: { text: 'Velocity' }},
//     yaxis: { min: 0, title: { text: 'Story Points' } },
//     stroke: { curve: 'smooth', width: 3 },
//     fill: { type: 'solid' },
//     dataLabels: { enabled: false },
//     legend: { show: false },
//     title: { text: `${sprint.name} Velocity Chart`, align: 'center' }
//   } as ChartOptions;
// }
//  }
ngOnInit() {
  const sprint = sprints.find(s => s.id === 'completed-1');
  if (!sprint) return;

  const issues: Issue[] = sprint.issues || [];
  const totalScopePoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  // Prepare date labels
  const dates: string[] = [];
  for (let d = new Date(sprint.startDate); d <= sprint.endDate; d.setDate(d.getDate() + 1)) {
    dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  // Compute cumulative completed points
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

  // Configure chart depending on type
  if (this.chartType === 'burnup') {
    const totalScope = Array(dates.length).fill(totalScopePoints);
    series = [
      { name: 'Completed Work', data: completed },
      { name: 'Total Scope', data: totalScope }
    ];
    chartType = 'area';
  } else if (this.chartType === 'burndown') {
    const remaining = completed.map(c => totalScopePoints - c);
    series = [{ name: 'Remaining Work', data: remaining }];
    chartType = 'area';
  } else if (this.chartType === 'velocity') {
    chartType = 'bar';
    categories = ['Total Story Points', 'Completed Story Points'];
    series = [{ name: 'Story Points', data: [totalScopePoints, completedPoints] }];

    plotOptions = {
      bar: {
        horizontal: false,
        distributed: true,     
        columnWidth: '40%',    
        // borderRadius: 6,
        // dataLabels: { position: 'top' }
      }
    };

    colors = ['#4A90E2', '#2ECC71'];  
  }

  // Assign final chartOptions
  this.chartOptions = {
    series,
    chart: { type: chartType, height: 350 },
    plotOptions,
    colors,
    xaxis: { categories, tickAmount: chartType === 'bar' ? undefined : Math.ceil(dates.length / 3) },
    yaxis: { min: 0, title: { text: 'Story Points' } },
    stroke: { curve: 'smooth', width: 3 },
    fill: chartType === 'bar' ? { type: 'solid' } : { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.6, opacityTo: 0.1, stops: [0, 90, 100] } },
    dataLabels: { enabled:false },
    legend: { show: false },
    title: { text: `${sprint.name} ${this.chartType.charAt(0).toUpperCase() + this.chartType.slice(1)} Chart`, align: 'center' }
  } as ChartOptions;
}

}
