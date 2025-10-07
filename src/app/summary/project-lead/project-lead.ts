import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface Lead {
  initials: string; // e.g., "AS"
  name: string; // e.g., "Alice Smith"
  role: string; // e.g., "Project Manager"
  bgColor: string; // e.g., "bg-[#FF5722]"
}
const EMPTY_LEAD: Lead = { initials: '?', name: 'N/A', role: 'N/A', bgColor: '' };

@Component({
  selector: 'app-project-lead',
  imports: [NgClass],
  templateUrl: './project-lead.html',
  styleUrl: './project-lead.css',
})
export class ProjectLead {
  @Input() leadData: Lead = EMPTY_LEAD;
}
