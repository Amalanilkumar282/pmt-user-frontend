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
  private _leadData: Lead = EMPTY_LEAD;
  @Input() set leadData(value: Lead | undefined) {
    // Defensive: always use a valid Lead object
    this._leadData = value && value.initials && value.name && value.role && value.bgColor !== undefined ? value : EMPTY_LEAD;
  }
  get leadData(): Lead {
    return this._leadData;
  }
}
