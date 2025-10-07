import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../../board/board-store';

@Component({
  selector: 'app-board-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './board-search.html',
})
export class BoardSearch {
  private store = inject(BoardStore) as BoardStore;
  q: string = '';

  constructor() {
    this.q = (this.store.search && typeof this.store.search === 'function') ? this.store.search() : '';
  }

  onChange(v: string) { this.store.setSearch(v); }
}
