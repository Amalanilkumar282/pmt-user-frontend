import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportDashboardRoutingModule } from './report-dashboard-routing-module';
import { ReportDashboardHome } from './report-dashboard-home/report-dashboard-home';
import { BurnupChart } from './burnup-chart/burnup-chart';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReportDashboardRoutingModule,ReportDashboardHome,BurnupChart
  ],
  exports:[ReportDashboardHome]
})
export class ReportDashboardModule { }
