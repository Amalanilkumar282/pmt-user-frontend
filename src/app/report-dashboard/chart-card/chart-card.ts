 import { Component, Input } from '@angular/core';

export interface ChartDataPoint {
  x: number;
  y: number;
}

export type ChartType = 'burnup' | 'burndown' | 'velocity';

@Component({
  selector: 'app-chart-card',
  imports: [],
  templateUrl: './chart-card.html',
  styleUrl: './chart-card.css'
})
export class ChartCard {
  
  @Input() title: string = 'Burnup Report';
  @Input() subtitle: string = 'Track progress and scope changes throughout the sprint';
  @Input() data: ChartDataPoint[] = [];
  @Input() detailsLink: string = '#';
  @Input() chartType: ChartType = 'burnup';
  
  chartWidth = 500;
  chartHeight = 150;

  ngOnInit() {
    if (this.data.length === 0) {
      this.data = this.generateDefaultData();
    }
  }

  get linePath(): string {
    if (!this.data || this.data.length === 0) return '';
    
    if (this.chartType === 'velocity') {
      return ''; // Velocity uses bars, not lines
    }
    
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
  if (this.chartType !== 'velocity' || !this.data || this.data.length === 0) {
    return [];
  }

  const maxY = Math.max(...this.data.map(d => d.y)) || 1;

  const totalBars = this.data.length;
  const totalSpacing = this.chartWidth * 0.15;
  const spacingBetween = totalSpacing / (totalBars + 1);
  const totalBarWidth = this.chartWidth - totalSpacing;
  const barWidth = totalBarWidth / totalBars;

  return this.data.map((point, index) => {
    const normalized = point.y / maxY;   // relative only to max, not min
    const x = spacingBetween * (index + 1) + barWidth * index;
    const height = normalized * this.chartHeight;
    const y = this.chartHeight - height;

    return { x, y, width: barWidth, height };
  });
}

  private normalizeData(data: ChartDataPoint[]): ChartDataPoint[] {
    const maxY = Math.max(...data.map(d => d.y));
    const minY = Math.min(...data.map(d => d.y));
    const range = maxY - minY || 1;
    
    return data.map(point => {
      const normalized = (point.y - minY) / range;
      // For burndown, invert the normalized value so high values appear at top
      // and low values at bottom (creating descending line)
      return {
        x: point.x,
        y: this.chartType === 'burndown' ? (1 - normalized) : normalized
      };
    });
  }

  private generateDefaultData(): ChartDataPoint[] {
    switch (this.chartType) {
      case 'burndown':
        // Burndown should start HIGH and end LOW (descending)
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
          { x: 0, y: 18 },
          { x: 1, y: 25 },
          { x: 2, y: 32 },
          { x: 3, y: 38 },
          { x: 4, y: 45 },
          { x: 5, y: 52 },
          { x: 6, y: 58 },
          { x: 7, y: 68 }
        ];
      case 'burnup':
      default:
        // Burnup should start LOW and end HIGH (ascending)
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