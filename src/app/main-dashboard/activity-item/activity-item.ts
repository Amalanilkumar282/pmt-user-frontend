import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActivityModel {
  id: string;
  user: string;
  initials: string;
  action: string;
  task: string;
  taskId: string;
  time: string;
  type: 'completed' | 'commented' | 'assigned';
}

@Component({
  selector: 'app-activity-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-item.html',
  styleUrls: ['./activity-item.css'],
})
export class ActivityItem {
  @Input() activity!: ActivityModel;
}
