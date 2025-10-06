import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardType = 'completed' | 'updated' | 'created' | 'due-soon';

@Component({
  selector: 'app-issue-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './issue-summary-card.html',
  styleUrl: './issue-summary-card.css',
})
export class IssueSummaryCard {
  @Input() type: CardType = 'completed';
  @Input() count: number = 0;
  @Input() label: string = '';
  @Input() timePeriod: string = 'in the last 7 days';

  getIconColor(): string {
    const colors: Record<CardType, string> = {
      completed: '#10b981',
      updated: '#6b7280',
      created: '#f59e0b',
      'due-soon': '#ef4444',
    };
    return colors[this.type];
  }
}
