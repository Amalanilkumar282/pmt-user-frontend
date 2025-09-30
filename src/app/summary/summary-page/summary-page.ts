import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueSummaryCard } from '../issue-summary-card/issue-summary-card';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';

interface SummaryCardData {
  type: 'completed' | 'updated' | 'created' | 'due-soon';
  count: number;
  label: string;
  timePeriod: string;
}

@Component({
  selector: 'app-summary-page',
  standalone: true,
  imports: [CommonModule, IssueSummaryCard, Sidebar, Navbar],
  templateUrl: './summary-page.html',
  styleUrl: './summary-page.css'
})
export class SummaryPage {
  @ViewChild(Sidebar) sidebar?: Sidebar;
  
  isSidebarCollapsed = signal(false);

  issueCards: SummaryCardData[] = [
    {
      type: 'completed',
      count: 12,
      label: 'COMPLETED',
      timePeriod: 'in the last 7 days'
    },
    {
      type: 'updated',
      count: 23,
      label: 'UPDATED',
      timePeriod: 'in the last 7 days'
    },
    {
      type: 'created',
      count: 8,
      label: 'CREATED',
      timePeriod: 'in the last 7 days'
    },
    {
      type: 'due-soon',
      count: 5,
      label: 'DUE SOON',
      timePeriod: 'in the next 7 days'
    }
  ];

  onSidebarCollapsedChange(collapsed: boolean): void {
    this.isSidebarCollapsed.set(collapsed);
  }

  onToggleSidebar(): void {
    if (this.sidebar) {
      this.sidebar.toggleCollapse();
    }
  }
}
