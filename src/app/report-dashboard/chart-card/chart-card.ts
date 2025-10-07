 import { NgFor, NgIf } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export interface ChartDataPoint {
  x: number;
  y: number;
}

export type ChartType = 'burnup' | 'burndown' | 'velocity';

@Component({
  selector: 'app-chart-card',
  templateUrl: './chart-card.html',
  styleUrls: ['./chart-card.css'],
  imports:[NgIf,NgFor]
})
export class ChartCard implements OnInit {

  @Input() title: string = 'Burnup Report';
  @Input() subtitle: string = 'Track progress and scope changes throughout the sprint';
  @Input() data: ChartDataPoint[] = [];
  @Input() detailsLink: string = '#';
  @Input() chartType: ChartType = 'burnup';

  chartWidth = 500;
  chartHeight = 150;

  constructor(private router: Router) {}

  ngOnInit() {
    if (!this.data || this.data.length === 0) {
      this.data = this.generateDefaultData();
    }
  }

  goToDetails() {
    if (this.detailsLink) {
      this.router.navigate([this.detailsLink]);
    }
  }

  get linePath(): string {
    if (!this.data || this.data.length === 0 || this.chartType === 'velocity') return '';

    const normalizedData = this.normalizeData(this.data);
    const points = normalizedData.map((point, index) => {
      const x = (index / (normalizedData.length - 1)) * this.chartWidth;
      const y = this.chartHeight - (point.y * this.chartHeight);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }

  get areaPath(): string {
    if (!this.data || this.data.length === 0 || this.chartType === 'velocity') return '';

    const linePath = this.linePath;
    const lastX = this.chartWidth;
    const bottomY = this.chartHeight;

    return `${linePath} L ${lastX},${bottomY} L 0,${bottomY} Z`;
  }

  get velocityBars(): Array<{ x: number; y: number; width: number; height: number }> {
    if (this.chartType !== 'velocity' || !this.data || this.data.length === 0) return [];

    const maxY = Math.max(...this.data.map(d => d.y)) || 1;
    const totalBars = this.data.length;

    const spacing = 20; // spacing between bars
    const barWidth = (this.chartWidth - spacing * (totalBars + 1)) / totalBars;

    return this.data.map((point, index) => {
      const normalized = point.y / maxY;
      const height = normalized * this.chartHeight;
      const y = this.chartHeight - height;
      const x = spacing + index * (barWidth + spacing);
      return { x, y, width: barWidth, height };
    });
  }
 


  private normalizeData(data: ChartDataPoint[]): ChartDataPoint[] {
    const maxY = Math.max(...data.map(d => d.y));
    const minY = Math.min(...data.map(d => d.y));
    const range = maxY - minY || 1;

    return data.map(point => {
      let normalized = (point.y - minY) / range;
      if (this.chartType === 'burndown') {
        normalized = (point.y - minY) / range; // keep descending as-is
      }
      return { x: point.x, y: normalized };
    });
  }

  private generateDefaultData(): ChartDataPoint[] {
    switch (this.chartType) {
      case 'burndown':
        return [
          { x: 0, y: 100 },
          { x: 1, y: 92 },
          { x: 2, y: 85 },
          { x: 3, y: 75 },
          { x: 4, y: 68 },
          { x: 5, y: 55 },
          { x: 6, y: 45 },
          { x: 7, y: 30 },
          { x: 8, y: 18 },
          { x: 9, y: 5 }
        ];
      case 'velocity':
        return [
          { x: 0, y: 35 },
          { x: 1, y: 50 },
          { x: 2, y: 32 },
          { x: 3, y: 38 },
          { x: 4, y: 30 },
          { x: 5, y: 52 },
          { x: 6, y: 58 },
          { x: 7, y: 68 }
        ];
      case 'burnup':
      default:
        return [
          { x: 0, y: 5 },
          { x: 1, y: 12 },
          { x: 2, y: 20 },
          { x: 3, y: 28 },
          { x: 4, y: 38 },
          { x: 5, y: 48 },
          { x: 6, y: 60 },
          { x: 7, y: 72 },
          { x: 8, y: 85 },
          { x: 9, y: 95 }
        ];
    }
  }
}
