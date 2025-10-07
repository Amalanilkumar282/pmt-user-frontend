import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../board-store';

@Component({
  selector: 'app-board-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './board-search.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardSearch {
  private store = inject(BoardStore);
  readonly search = this.store.search;

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.store.setSearch(val);
  }
}
