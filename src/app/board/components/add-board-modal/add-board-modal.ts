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
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  currentProjectId = signal<string>('');
  selectedSource = signal<BoardSource>('CUSTOM');
  selectedTeam = signal<string | null>(null);
  
  boardForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
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
    
    // Generate unique board name based on project and timestamp
    const projectName = this.getProjectName(projectId);
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    this.boardForm.patchValue({ name: `${projectName} Board - ${timestamp}` });
  }
  
  closeModal(): void {
    this.isOpen.set(false);
    this.isSaving.set(false);
    this.errorMessage.set(null);
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
        const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        this.boardForm.patchValue({ teamId: teams[0].id, name: `${teams[0].name} Board - ${timestamp}` });
      }
    } else {
      this.selectedTeam.set(null);
      this.boardForm.patchValue({ teamId: '' });
      const projectName = this.getProjectName(this.currentProjectId());
      const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      this.boardForm.patchValue({ name: `${projectName} Board - ${timestamp}` });
    }
  }
  
  onTeamChange(teamId: string): void {
    this.selectedTeam.set(teamId);
    this.boardForm.patchValue({ teamId });
    
    const team = this.teamsService.getTeamById(teamId);
    if (team) {
      const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      this.boardForm.patchValue({ name: `${team.name} Board - ${timestamp}` });
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
  
  async onSubmit(): Promise<void> {
    if (!this.boardForm.valid) {
      this.errorMessage.set('Please fill in all required fields');
      return;
    }
    
    const formValue = this.boardForm.value;
    
    // Validate team board has teamId
    if (formValue.source === 'TEAM' && !formValue.teamId) {
      this.errorMessage.set('Please select a team for this board');
      return;
    }
    
    this.isSaving.set(true);
    this.errorMessage.set(null);
    
    try {
      console.log('[AddBoardModal] Creating board with values:', formValue);
      
      // Map board source to backend type
      let boardType = 'kanban'; // default
      if (formValue.source === 'TEAM') {
        boardType = 'team';
      } else if (formValue.source === 'CUSTOM') {
        boardType = 'custom';
      }
      
      const board = await this.boardService.createBoardApi({
        name: formValue.name!,
        description: formValue.description || '',
        projectId: formValue.projectId!,
        type: boardType,
        source: formValue.source as BoardSource,
        teamId: formValue.teamId ? parseInt(formValue.teamId, 10) : undefined,
        columns: [], // Backend creates default columns
        includeBacklog: this.includeBacklog(),
        includeDone: this.includeDone(),
      });
      
      if (board) {
        console.log('[AddBoardModal] Board created successfully:', board);
        this.boardCreated.emit(board.id);
        this.closeModal();
      }
    } catch (error: any) {
      console.error('[AddBoardModal] Error creating board:', error);
      
      // Extract error message from backend response
      let errorMsg = 'An error occurred while creating the board. Please try again.';
      
      if (error?.error?.message) {
        errorMsg = error.error.message;
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      this.errorMessage.set(errorMsg);
    } finally {
      this.isSaving.set(false);
    }
  }
}
