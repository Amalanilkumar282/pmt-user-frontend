import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../board-store';

@Component({
  selector: 'app-board-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="board-search">
      <input
        type="text"
        placeholder="Search issues, comments, or IDs..."
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        [value]="search()"
        (input)="onInput($event)"
      />
    </div>
  `,
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
