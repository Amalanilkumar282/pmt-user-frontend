import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Issue } from '../../shared/models/issue.model';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
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
export class MetricsChart implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;
  @ViewChild('apxChart', { static: false }) apxChart?: ChartComponent;
  
  @Input() issues: Issue[] = [];
  @Input() sprintId: string | null = null;
  @Input() sprintData: { name: string; startDate: Date; endDate: Date } | null = null;

  public chartOptions: ChartOptions | null = null;
  public showChart: boolean = false;
  @Input() chartType: 'burnup' | 'burndown' | 'velocity' = 'burnup';
  
  private viewInitialized = false;

  constructor(private cdr: ChangeDetectorRef) {}




  chart: any;

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy(); // cleanup
    }
  }

  ngOnInit() {
    console.log('MetricsChart ngOnInit - issues:', this.issues.length, 'sprintData:', this.sprintData);
    // Don't build chart yet - wait for view to be initialized
  }

  ngAfterViewInit() {
    console.log('🔵 MetricsChart ngAfterViewInit - View is ready', 'chartContainer exists:', !!this.chartContainer);
    console.log('🔵 Initial data:', { issues: this.issues.length, sprintId: this.sprintId, sprintData: this.sprintData });
    this.viewInitialized = true;
    
    // Only build chart if we have data
    if (this.issues.length > 0 || this.sprintData) {
      console.log('🔵 Has initial data, building chart');
      this.buildChart();
      console.log('🔵 After buildChart, chartOptions exists:', !!this.chartOptions);
      
      // Then show the chart after Angular has processed the current update
      setTimeout(() => {
        if (this.chartOptions) {
          this.showChart = true;
          console.log('✅ Setting showChart = true, chartOptions series length:', this.chartOptions.series?.length);
          this.cdr.detectChanges();
        }
      }, 150);
    } else {
      console.log('⏳ No initial data, waiting for ngOnChanges');
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Whenever inputs change, rebuild chart
    console.log('🟡 MetricsChart ngOnChanges:', {
      issues: this.issues.length,
      sprintId: this.sprintId,
      sprintData: this.sprintData,
      changes: Object.keys(changes),
      viewInitialized: this.viewInitialized
    });
    
    // Check if we have meaningful data
    const hasData = this.issues.length > 0 || this.sprintData;
    console.log('🟡 Has data to display:', hasData);
    
    // Only rebuild if view is initialized OR if we're still in the initial setup
    if (hasData) {
      // Hide chart first if it was showing
      if (this.showChart) {
        this.showChart = false;
        this.cdr.detectChanges();
      }
      
      // Rebuild chart options
      setTimeout(() => {
        this.buildChart();
        console.log('🟡 After buildChart in ngOnChanges, chartOptions exists:', !!this.chartOptions);
        
        // Show chart again
        setTimeout(() => {
          if (this.chartOptions) {
            this.showChart = true;
            console.log('✅ Setting showChart = true in ngOnChanges');
            this.cdr.detectChanges();
          } else {
            console.log('❌ chartOptions is null after buildChart');
          }
        }, 50);
      }, 50);
    } else {
      console.log('⏳ No data yet, skipping chart build');
    }
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
    console.log('🔧 buildChart called with:', {
      inputIssues: this.issues.length,
      sprintId: this.sprintId,
      sprintData: this.sprintData
    });

    const today = new Date();

    // Use the @Input() issues if provided, otherwise fall back to dummy data
    let issues: Issue[] = this.issues && this.issues.length > 0 ? this.issues : [];
    let sprintName = 'Sprint';
    let sprintStartDate: Date | undefined;
    let sprintEndDate: Date | undefined;

    console.log('📊 Using issues:', issues.length, 'issues');

    // Use sprintData passed from parent (from API)
    if (this.sprintData) {
      console.log('✅ Using sprintData from parent:', this.sprintData);
      sprintName = this.sprintData.name;
      sprintStartDate = this.sprintData.startDate;
      sprintEndDate = this.sprintData.endDate;
    } else {
      console.warn('⚠️ No sprint data provided. Chart cannot be rendered without sprint information.');
      return;
    }

    if (!sprintStartDate || !sprintEndDate) {
      console.warn('❌ No sprint date range available. Aborting chart build.');
      return;
    }

    console.log('📅 Sprint dates:', { start: sprintStartDate, end: sprintEndDate });
    const totalScopePoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    console.log('📈 Total story points:', totalScopePoints);

    const dates: string[] = [];
    for (
      let d = new Date(sprintStartDate);
      d <= new Date(sprintEndDate);
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    const completed: number[] = [];
    let cumulative = 0;
    const counted: Set<string> = new Set();

    // Debug: Log all issues with their status and dates
    console.log('🔍 Issue details for progress tracking:');
    const doneIssues = issues.filter(i => i.status === 'DONE');
    console.log(`  Total issues: ${issues.length}, DONE issues: ${doneIssues.length}`);
    
    issues.forEach(issue => {
      console.log(`  - ${issue.title || issue.id}:`, {
        status: issue.status,
        storyPoints: issue.storyPoints,
        completedAt: issue.completedAt,
        updatedAt: issue.updatedAt,
        createdAt: issue.createdAt
      });
    });

    dates.forEach((dateLabel, index) => {
      const currentDate = new Date(sprintStartDate);
      currentDate.setDate(new Date(sprintStartDate).getDate() + index);
      currentDate.setHours(23, 59, 59, 999); // End of day

      issues.forEach(issue => {
        if (issue.status === 'DONE' && !counted.has(issue.id)) {
          let doneDate: Date | null = null;
          
          // Priority 1: Use completedAt if available
          if (issue.completedAt && !isNaN(issue.completedAt.getTime())) {
            doneDate = issue.completedAt;
          }
          // Priority 2: Use updatedAt if it's valid
          else if (issue.updatedAt && !isNaN(issue.updatedAt.getTime())) {
            doneDate = issue.updatedAt;
          }
          
          if (!doneDate) {
            // No valid date - distribute evenly or add on last day
            console.warn(`⚠️ Issue ${issue.title} is DONE but has no valid completion date`);
            // Add on the last day of sprint
            if (index === dates.length - 1) {
              cumulative += issue.storyPoints || 0;
              counted.add(issue.id);
              console.log(`  ✅ Added ${issue.storyPoints} points on last day for ${issue.title}`);
            }
          } else {
            if (doneDate <= currentDate) {
              cumulative += issue.storyPoints || 0;
              counted.add(issue.id);
              console.log(`  ✅ Added ${issue.storyPoints} points on ${dateLabel} for ${issue.title} (completed: ${doneDate.toLocaleDateString()})`);
            }
          }
        }
      });

      completed.push(cumulative);
      if (index === 0 || index === dates.length - 1 || cumulative > 0) {
        console.log(`  Day ${index + 1} (${dateLabel}): ${cumulative} points completed`);
      }
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
      chart: {
        type: chartType, 
        height: 350,
        width: '100%',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        },
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: true,
          zoomedArea: {
            fill: { color: '#90CAF9', opacity: 0.2 },
            stroke: { color: '#0D47A1', opacity: 0.4, width: 1 },
          }
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: true,
            zoomout: true,
            pan: false,
            reset: true
          }
        }
      },
      plotOptions,
      colors,
      xaxis: { categories },
      yaxis: { min: 0, title: { text: 'Story Points', style: { fontWeight: '500' } } },
      stroke: { curve: 'smooth', width: 3 },
      fill: chartType === 'bar'
        ? { type: 'solid' }
        : { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.6, opacityTo: 0.1, stops: [0, 90, 100] } },
      dataLabels: { enabled: false },
      legend: { show: false },
      title: { text: `${sprintName} ${this.chartType.toUpperCase()} Chart`, align: 'center' }
    } as ChartOptions;

    console.log('✅ Chart built successfully:', {
      seriesCount: series.length,
      dataPoints: series[0]?.data?.length || 0,
      categories: categories.length,
      title: `${sprintName} ${this.chartType.toUpperCase()} Chart`,
      seriesData: series.map(s => ({ name: s.name, data: s.data })),
      chartOptions: this.chartOptions
    });
  }

}
