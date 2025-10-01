import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CreateIssue } from './modal/create-issue/create-issue';
import { ReportDashboardModule } from './report-dashboard/report-dashboard-module';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CreateIssue,ReportDashboardModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

}
