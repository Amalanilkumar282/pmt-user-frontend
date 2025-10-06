import { NgClass, NgFor, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  Inject,
} from '@angular/core';

interface SprintStatus {
  label: string;
  count: number;
  colorClass: string;
}

@Component({
  selector: 'app-sprint-overview',
  imports: [NgClass, NgFor],
  standalone: true,
  templateUrl: './sprint-overview.html',
  styleUrls: ['./sprint-overview.css'],
})
export class SprintOverview implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title = 'Sprint overview';
  @Input() description = 'Get a snapshot of the status of your work items.';
  @Input() statuses: SprintStatus[] = [];

  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  private chart: any = null;
  private ApexCharts: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      this.ApexCharts = (await import('apexcharts')).default;
      this.renderChart();
    }
  }

  ngOnChanges(): void {
    if (this.chart) {
      this.updateChart();
    }
  }

  private renderChart(): void {
    if (!this.chartContainer || this.statuses.length === 0 || !this.ApexCharts) return;

    const options: any = {
      series: this.statuses.map((s) => s.count),
      chart: {
        type: 'donut',
        height: 160,
        width: 160,
      },
      labels: this.statuses.map((s) => s.label),
      colors: this.getColors(),
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1F2937',
                formatter: (w: any) =>
                  w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString(),
              },
              value: {
                fontSize: '20px',
                fontWeight: 700,
                color: '#1F2937',
              },
            },
          },
        },
      },
      stroke: {
        width: 0,
      },
    };

    this.chart = new this.ApexCharts(this.chartContainer.nativeElement, options);
    this.chart.render();
  }

  private updateChart(): void {
    if (!this.chart) return;

    this.chart.updateOptions({
      series: this.statuses.map((s) => s.count),
      labels: this.statuses.map((s) => s.label),
      colors: this.getColors(),
    });
  }

  private getColors(): string[] {
    const colorMap: { [key: string]: string } = {
      'bg-status-green': '#10B981',
      'bg-status-yellow': '#F59E0B',
      'bg-status-blue': '#3B82F6',
      'bg-status-red': '#EF4444',
      'bg-status-purple': '#8B5CF6',
      'bg-status-pink': '#EC4899',
      'bg-status-indigo': '#6366F1',
      'bg-status-teal': '#14B8A6',
    };

    return this.statuses.map((s) => colorMap[s.colorClass] || '#6B7280');
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
