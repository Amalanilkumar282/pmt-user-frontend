import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportDashboardRoutingModule } from './report-dashboard-routing-module';
import { ReportDashboardHome } from './report-dashboard-home/report-dashboard-home';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReportDashboardRoutingModule,ReportDashboardHome
  ],
  exports:[ReportDashboardHome]
})
export class ReportDashboardModule { }
