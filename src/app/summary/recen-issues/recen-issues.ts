import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

interface Issue {
  title: string;
  code: string;
  statusBg: string;
  statusLetter: string;
  assigneeBg: string;
  assigneeInitials: string;
  description?: string; // add description
  status?: string; // e.g. "In Progress", "Done"
  priority?: string; // e.g. "High", "Medium"
}

@Component({
  selector: 'app-recen-issues',
  imports: [NgFor],
  templateUrl: './recen-issues.html',
  styleUrl: './recen-issues.css',
})
export class RecenIssues {
  @Input() issues: Issue[] = [];
}
