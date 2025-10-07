import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Epic } from '../../../../shared/models/epic.model';

@Component({
  selector: 'app-epic-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './epic-header.html',
  styleUrl: './epic-header.css'
})
export class EpicHeader {
  @Input() epic!: Epic;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
