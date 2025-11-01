import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AISuggestionResponse } from '../../shared/services/ai-sprint-planning.service';

@Component({
  selector: 'app-ai-sprint-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-sprint-modal.html',
  styleUrl: './ai-sprint-modal.css'
})
export class AiSprintModal {
  @Input() isOpen = false;
  @Input() suggestions: AISuggestionResponse | null = null;
  @Input() isLoading = false;
  @Output() close = new EventEmitter<void>();
  @Output() commitChanges = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onCommit(): void {
    this.commitChanges.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  getTotalStoryPoints(): number {
    if (!this.suggestions?.recommended_issues) return 0;
    return this.suggestions.recommended_issues.reduce(
      (sum, issue) => sum + (issue.story_points || 0),
      0
    );
  }
}
