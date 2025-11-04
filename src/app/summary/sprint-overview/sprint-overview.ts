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
    console.log('📊 [SprintOverview] ngOnChanges called with statuses:', this.statuses);
    console.log('📊 [SprintOverview] Chart exists:', !!this.chart);
    console.log('📊 [SprintOverview] ApexCharts loaded:', !!this.ApexCharts);
    console.log('📊 [SprintOverview] Chart container:', !!this.chartContainer);
    
    if (isPlatformBrowser(this.platformId)) {
      if (this.chart) {
        console.log('📊 [SprintOverview] Updating existing chart');
        this.updateChart();
      } else if (this.ApexCharts && this.chartContainer && this.statuses.length > 0) {
        // If chart doesn't exist yet but we have data and ApexCharts is loaded, render it
        console.log('📊 [SprintOverview] Rendering new chart with data');
        this.renderChart();
      } else {
        console.log('📊 [SprintOverview] Cannot render chart yet:', {
          hasApexCharts: !!this.ApexCharts,
          hasContainer: !!this.chartContainer,
          statusesLength: this.statuses.length
        });
      }
    }
  }

  private renderChart(): void {
    console.log('📊 [SprintOverview] renderChart called');
    console.log('📊 [SprintOverview] Container:', !!this.chartContainer);
    console.log('📊 [SprintOverview] Statuses length:', this.statuses.length);
    console.log('📊 [SprintOverview] ApexCharts:', !!this.ApexCharts);
    
    if (!this.chartContainer || this.statuses.length === 0 || !this.ApexCharts) {
      console.warn('⚠️ [SprintOverview] Cannot render chart - missing requirements');
      return;
    }

    // Destroy existing chart if it exists
    if (this.chart) {
      console.log('📊 [SprintOverview] Destroying existing chart');
      this.chart.destroy();
      this.chart = null;
    }

    console.log('📊 [SprintOverview] Creating chart with statuses:', this.statuses);

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
    console.log('✅ [SprintOverview] Chart rendered successfully');
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
      'bg-green-500': '#4CAF50',
      'bg-yellow-500': '#F59E0B',
      'bg-blue-500': '#3B82F6',
      'bg-red-500': '#EF4444',
      'bg-purple-500': '#8B5CF6',
      'bg-pink-500': '#EC4899',
      'bg-indigo-500': '#6366F1',
      'bg-teal-500': '#14B8A6',
    };

    return this.statuses.map((s) => colorMap[s.colorClass] || '#6B7280');
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
