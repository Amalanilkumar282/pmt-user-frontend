// // summary-bar-chart.ts

// import { DecimalPipe, NgClass, NgFor, NgStyle } from '@angular/common';
// import { Component, Input } from '@angular/core';

// interface Issue {
//   name: string;
//   count: number;
// }

// @Component({
//   selector: 'app-summary-bar-chart',
//   standalone: true,
//   imports: [NgClass, NgFor, DecimalPipe, NgStyle],
//   templateUrl: './summary-bar-chart.html',
//   styleUrl: './summary-bar-chart.css',
// })
// export class SummaryBarChart {
//   @Input() issues: Issue[] = [];

//   get maxCount(): number {
//     // Calculates the maximum count for scaling, defaults to 1 to prevent division by zero
//     const max = Math.max(...this.issues.map((i) => i.count), 1);
//     // Console log the maximum count
//     // console.log('maxCount:', max);
//     return max;
//   }

//   getBarColor(index: number): string {
//     const colors = [
//       '#4CAF50', // Green for index 0
//       '#3C8EFA', // Blue for index 1
//       '#EF4444', // Red for index 2
//       '#F59E0B', // Amber/Orange for index 3
//     ];
//     return colors[index % colors.length] || 'gray';
//   }

//   // 👇 NEW DEBUGGING METHOD
//   getBarHeight(count: number, issueName: string): string {
//     const max = this.maxCount;
//     // Calculate height as a percentage
//     const heightPercentage = (count / max) * 100;

//     // 🚨 CONSOLE LOG THE CALCULATION
//     console.log(`Issue: ${issueName} (Count: ${count})`);
//     console.log(`maxCount: ${max}`);
//     console.log(`Calculated Height: ${heightPercentage.toFixed(2)}%`);

//     // Return the final height string for the style binding
//     return `${heightPercentage}px`;
//   }
// }
import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexGrid,
  ChartComponent,
} from 'ng-apexcharts';

interface Issue {
  name: string;
  count: number;
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  colors: string[];
  grid: ApexGrid;
};

@Component({
  selector: 'app-summary-bar-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './summary-bar-chart.html',
  styleUrls: ['./summary-bar-chart.css'],
})
export class SummaryBarChart implements OnChanges {
  @ViewChild('chart') chart!: ChartComponent;
  @Input() issues: Issue[] = [];

  public chartOptions: Partial<ChartOptions>;

  constructor() {
    this.chartOptions = this.getChartOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['issues'] && this.issues.length > 0) {
      this.chartOptions = this.getChartOptions();
    }
  }

  private getChartOptions(): Partial<ChartOptions> {
    const colors = ['#4CAF50', '#3C8EFA', '#EF4444', '#F59E0B'];

    return {
      series: [
        {
          name: 'Count',
          data: this.issues.map((issue) => issue.count),
        },
      ],
      chart: {
        type: 'bar',
        height: 250,
        toolbar: {
          show: false,
        },
        fontFamily: 'sans-serif',
      },
      plotOptions: {
        bar: {
          columnWidth: '45px',
          distributed: true,
          borderRadius: 2,
          dataLabels: {
            position: 'top',
          },
        },
      },
      colors: this.issues.map((_, index) => colors[index % colors.length]),
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: this.issues.map((issue) => issue.name),
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '14px',
            fontWeight: 500,
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        title: {
          text: 'Count',
          style: {
            color: '#6B7280',
            fontSize: '14px',
            fontWeight: 400,
          },
        },
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '10px',
          },
        },
      },
      grid: {
        borderColor: '#E5E7EB',
        strokeDashArray: 0,
        yaxis: {
          lines: {
            show: true,
          },
        },
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
    };
  }
}
