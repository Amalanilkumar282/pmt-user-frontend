import { NgFor } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-project-info',
  imports: [NgFor],
  templateUrl: './project-info.html',
  styleUrl: './project-info.css',
})
export class ProjectInfo {
  @Input() projectDetails: any;
}
