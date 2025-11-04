import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Issue, IssueType } from '../../../../shared/models/issue.model';

@Component({
  selector: 'app-work-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-item-form.html',
  styleUrl: './work-item-form.css'
})
export class WorkItemForm {
  @Output() workItemCreated = new EventEmitter<Issue>();

  title = '';
  type: IssueType = 'TASK';
  showTypeDropdown = false;
  issueTypes: IssueType[] = ['TASK', 'STORY', 'BUG', 'EPIC', 'SUBTASK'];

  toggleTypeDropdown() {
    this.showTypeDropdown = !this.showTypeDropdown;
  }

  selectType(type: IssueType) {
    this.type = type;
    this.showTypeDropdown = false;
  }

  addWorkItem() {
    if (this.title.trim()) {
      const newWorkItem: Partial<Issue> = {
        title: this.title.trim(),
        type: this.type,
        priority: 'MEDIUM',
        status: 'TODO',
        assignee: 'Unassigned',
        storyPoints: 0
      };
      
      this.workItemCreated.emit(newWorkItem as Issue);
      this.title = '';
      this.type = 'TASK';
    }
  }

  getTypeIcon(type: IssueType): string {
    const iconMap: { [key: string]: string } = {
      'TASK': 'fa-solid fa-check-square',
      'STORY': 'fa-solid fa-book',
      'BUG': 'fa-solid fa-bug',
      'EPIC': 'fa-solid fa-bolt',
      'SUBTASK': 'fa-solid fa-circle-check'
    };
    return iconMap[type] || 'fa-solid fa-check-square';
  }
}
