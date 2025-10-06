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
