import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { TimelineChart } from '../timeline-chart/timeline-chart';

@Component({
  selector: 'app-timeline-component',
  standalone: true,
  imports: [Navbar, Sidebar, TimelineChart],
  templateUrl: './timeline-component.html',
  styleUrl: './timeline-component.css'
})
export class TimelineComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  ngOnInit(): void {
    // Set project context from route params
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
    }
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
}