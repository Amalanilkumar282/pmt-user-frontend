import { Component, inject, signal, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BoardService } from '../../services/board.service';
import { TeamsService } from '../../../teams/services/teams.service';
import { BoardType, BoardSource } from '../../models/board.model';
import { DEFAULT_COLUMNS } from '../../utils';
import { BoardColumnDef } from '../../models';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-add-board-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClickOutsideDirective],
  templateUrl: './add-board-modal.html',
  styleUrls: ['./add-board-modal.css']
})
export class AddBoardModal {
  private fb = inject(FormBuilder);
  private boardService = inject(BoardService);
  private teamsService = inject(TeamsService);
  
  @Output() close = new EventEmitter<void>();
  @Output() boardCreated = new EventEmitter<string>(); // emits boardId
  
  isOpen = signal(false);
  currentProjectId = signal<string>('');
  selectedSource = signal<BoardSource>('CUSTOM');
  selectedTeam = signal<string | null>(null);
  
  boardForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    projectId: ['', Validators.required],
    source: ['CUSTOM' as BoardSource, Validators.required],
    teamId: [''],
  });
  
  // Column selection
  availableColumns = signal<BoardColumnDef[]>([...DEFAULT_COLUMNS]);
  selectedColumns = signal<Set<string>>(new Set(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']));
  
  // Options
  includeBacklog = signal(true);
  includeDone = signal(true);
  
  open(projectId: string): void {
    this.currentProjectId.set(projectId);
    this.boardForm.patchValue({ projectId });
    this.isOpen.set(true);
    
    // Auto-fill board name based on project
    const projectName = this.getProjectName(projectId);
    this.boardForm.patchValue({ name: `${projectName} Board` });
  }
  
  closeModal(): void {
    this.isOpen.set(false);
    this.boardForm.reset();
    this.selectedSource.set('CUSTOM');
    this.selectedTeam.set(null);
    this.selectedColumns.set(new Set(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']));
    this.close.emit();
  }
  
  onSourceChange(source: BoardSource): void {
    this.selectedSource.set(source);
    this.boardForm.patchValue({ source });
    
    if (source === 'TEAM') {
      // When team is selected, show teams dropdown
      const teams = this.getProjectTeams();
      if (teams.length > 0) {
        this.selectedTeam.set(teams[0].id);
        this.boardForm.patchValue({ teamId: teams[0].id, name: `${teams[0].name} Board` });
      }
    } else {
      this.selectedTeam.set(null);
      this.boardForm.patchValue({ teamId: '' });
      const projectName = this.getProjectName(this.currentProjectId());
      this.boardForm.patchValue({ name: `${projectName} Board` });
    }
  }
  
  onTeamChange(teamId: string): void {
    this.selectedTeam.set(teamId);
    this.boardForm.patchValue({ teamId });
    
    const team = this.teamsService.getTeamById(teamId);
    if (team) {
      this.boardForm.patchValue({ name: `${team.name} Board` });
    }
  }
  
  toggleColumn(columnId: string): void {
    const columns = new Set(this.selectedColumns());
    if (columns.has(columnId)) {
      columns.delete(columnId);
    } else {
      columns.add(columnId);
    }
    this.selectedColumns.set(columns);
  }
  
  isColumnSelected(columnId: string): boolean {
    return this.selectedColumns().has(columnId);
  }
  
  getProjectTeams() {
    const projectId = this.currentProjectId();
    return projectId ? this.teamsService.getTeamsByProject(projectId) : [];
  }
  
  getProjectName(projectId: string): string {
    const projectNames: Record<string, string> = {
      '1': 'Website Redesign',
      '2': 'Mobile App Development',
      '3': 'Marketing Campaign',
      '4': 'Backend Infrastructure',
      '5': 'Customer Portal',
    };
    return projectNames[projectId] || 'Project';
  }
  
  onSubmit(): void {
    if (!this.boardForm.valid) {
      console.error('Form is invalid');
      return;
    }
    
    const formValue = this.boardForm.value;
    const selectedCols = Array.from(this.selectedColumns());
    
    if (selectedCols.length === 0) {
      console.error('At least one column must be selected');
      return;
    }
    
    const columns = this.availableColumns().filter(c => selectedCols.includes(c.id));
    
    const board = this.boardService.createBoard({
      name: formValue.name!,
      projectId: formValue.projectId!,
      type: formValue.source === 'TEAM' ? 'TEAM' : 'PROJECT',
      source: formValue.source as BoardSource,
      teamId: formValue.teamId || undefined,
      columns,
      includeBacklog: this.includeBacklog(),
      includeDone: this.includeDone(),
    });
    
    if (!board) {
      console.error('Failed to create board');
      return;
    }
    
    this.boardCreated.emit(board.id);
    this.closeModal();
  }
}
