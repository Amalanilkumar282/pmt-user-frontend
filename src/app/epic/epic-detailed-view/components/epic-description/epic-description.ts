import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Epic } from '../../../../shared/models/epic.model';

@Component({
  selector: 'app-epic-description',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './epic-description.html',
  styleUrl: './epic-description.css'
})
export class EpicDescription {
  @Input() epic!: Epic;
  @Output() epicUpdated = new EventEmitter<Epic>();

  editing = false;
  tempDescription = '';

  startEditing() {
    this.editing = true;
    this.tempDescription = this.epic.description || '';
  }

  save() {
    this.epic.description = this.tempDescription;
    this.editing = false;
    this.epicUpdated.emit(this.epic);
  }

  cancel() {
    this.editing = false;
  }
}
