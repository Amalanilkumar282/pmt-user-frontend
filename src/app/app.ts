import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReportDashboardModule } from './report-dashboard/report-dashboard-module';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,ReportDashboardModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

}
