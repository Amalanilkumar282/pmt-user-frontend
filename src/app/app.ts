import { Component, HostBinding, inject } from '@angular/core';
import { SidebarStateService } from './shared/services/sidebar-state.service';
import { RouterOutlet } from '@angular/router';
import { CreateIssue} from './modal/create-issue/create-issue';
import { ReportDashboardModule } from './report-dashboard/report-dashboard-module';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CreateIssue,ReportDashboardModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})


export class App {
  private sidebarState = inject(SidebarStateService);
  // Bind host class to the readonly signal so Angular updates the class reactively
  @HostBinding('class.app-sidebar-collapsed')
  get collapsed() {
    return this.sidebarState.isCollapsed();
  }

}
