import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

interface Lead {
  initials: string; // e.g., "AS"
  name: string; // e.g., "Alice Smith"
  role: string; // e.g., "Project Manager"
  bgColor: string; // e.g., "bg-[#FF5722]"
}
@Component({
  selector: 'app-project-lead',
  imports: [NgClass],
  templateUrl: './project-lead.html',
  styleUrl: './project-lead.css',
})
export class ProjectLead {
  @Input() leadData!: Lead; // Input from parent
}
