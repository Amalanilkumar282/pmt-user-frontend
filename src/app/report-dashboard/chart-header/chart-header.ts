import { Component,Input,EventEmitter,Output } from '@angular/core';

export interface SprintOption {
  id: string;
  name: string;
}
@Component({
  selector: 'app-chart-header',
  imports: [],
  templateUrl: './chart-header.html',
  styleUrl: './chart-header.css'
})

export class ChartHeader {
  @Input() title: string = '';
  @Input() sprints: SprintOption[] = [];
  @Input() selectedSprint: string = '';
  @Output() back = new EventEmitter<void>();
  @Output() sprintChange = new EventEmitter<string>();

  onBack() {
    this.back.emit();
  }

  onSprintChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.sprintChange.emit(select.value);
  }

}
