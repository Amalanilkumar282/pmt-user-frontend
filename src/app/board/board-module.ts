// board.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { BoardPage } from './components/board-page/board-page';
import { BoardToolbar } from './components/board-toolbar/board-toolbar';
import { SprintSelect } from './components/sprint-select/sprint-select';
import { FilterPanel } from './components/filter-panel/filter-panel';
import { GroupByMenu } from './components/group-by-menu/group-by-menu';
import { BoardColumnsContainer } from './components/board-columns-container/board-columns-container';
import { BoardColumn } from './components/board-column/board-column';
import { TaskCard } from './components/task-card/task-card';
import { AddColumnButton } from './components/add-column-button/add-column-button';
import { BOARD_ROUTES } from './board.routes';

@NgModule({
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    DragDropModule, 
    RouterModule.forChild(BOARD_ROUTES),
    // Import standalone components
    BoardPage,
    BoardToolbar,
    SprintSelect,
    FilterPanel,
    GroupByMenu,
    BoardColumnsContainer,
    BoardColumn,
    TaskCard,
    AddColumnButton
  ]
})
export class BoardModule {}
