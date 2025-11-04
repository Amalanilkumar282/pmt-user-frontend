import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../board-store';
import { IssueStatus } from '../../../shared/models/issue.model';
import { BoardService } from '../../services/board.service';
import { StatusApiService, Status } from '../../services/status-api.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-add-column-button',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-column-button.html',
  styleUrl: './add-column-button.css'
})
export class AddColumnButton {
  private store = inject(BoardStore);
  private boardService = inject(BoardService);
  private statusApiService = inject(StatusApiService);
  private toastService = inject(ToastService);
  
  isOpen = false;
  name = '';
  color = '#3D62A8'; // Default to primary color
  position = 1; // Default position
  // Selected existing status id (if any) and canonical status name for existing or new statuses
  selectedStatusId?: number | null = null;
  selectedStatusName: string = '';
  statusSearchQuery = ''; // Search query for status
  showStatusDropdown = false; // Show/hide status dropdown
  isLoading = false;
  error: string | null = null;

  // Existing statuses from backend (loaded when modal opens)
  private existingStatuses = signal<Status[]>([]);

  // No hardcoded presets: statuses are provided by the backend per-project

  // Get current columns to determine max position
  currentColumns = computed(() => this.store.columns());
  
  // Get max position for validation
  maxPosition = computed(() => {
    const columns = this.currentColumns();
    return columns.length > 0 ? Math.max(...columns.map(c => c.position)) + 1 : 1;
  });

  // Available statuses are the ones returned by the backend for the project
  // Each item: { id, statusName, label, isExisting }
  availableStatuses = computed(() => {
    return this.existingStatuses().map(s => ({
      id: s.id,
      statusName: s.statusName,
      label: this.humanizeLabel(s.statusName),
      isExisting: true
    }));
  });

  // Normalize status name for case/space insensitive comparison
  private getNormalizedKey(input: string): string {
    return input.trim().toLowerCase().replace(/[\s_]+/g, '');
  }

  // If input matches one of the preset labels or codes, return the preset canonical code
  private getPresetCodeFromInput(input: string): string | null {
    const normalized = this.getNormalizedKey(input);
    // No presets: defer matching to loaded statuses only
    const found = this.existingStatuses().find(s => this.getNormalizedKey(s.statusName) === normalized);
    return found ? String(found.statusName) : null;
  }

  // Find matching existing status by normalized comparison
  private findMatchingStatus(input: string): Status | null {
    const normalized = this.getNormalizedKey(input);
    return this.existingStatuses().find(s => 
      this.getNormalizedKey(s.statusName) === normalized
    ) || null;
  }

  // Filtered statuses (based on loaded backend statuses) using label or statusName
  get filteredStatuses(): { id: number; statusName: string; label: string; isExisting: boolean }[] {
    const q = this.statusSearchQuery.trim().toLowerCase();
    const available = this.availableStatuses();
    if (!q) return available;
    return available.filter(s => {
      return s.label.toLowerCase().includes(q) || s.statusName.toLowerCase().includes(q);
    });
  }

  // Check if the entered status is new (not in existing statuses)
  get isNewStatus(): boolean {
    const q = this.statusSearchQuery.trim();
    if (!q) return false;
    const matchesExisting = this.findMatchingStatus(q) !== null;
    return !matchesExisting;
  }

  // Jira-like: Only 6 essential preset colors for quick access
  presetColors = [
    '#3D62A8', // Primary Blue
    '#10B981', // Success Green
    '#F59E0B', // Warning Amber
    '#EF4444', // Danger Red
    '#8B5CF6', // Purple
    '#64748B', // Neutral Gray
  ];

  // Simplified color names
  private colorNames: Record<string, string> = {
    '#3D62A8': 'Blue',
    '#10B981': 'Green',
    '#F59E0B': 'Amber',
    '#EF4444': 'Red',
    '#8B5CF6': 'Purple',
    '#64748B': 'Gray',
  };

  getColorName(hex: string): string {
    return this.colorNames[hex] || 'Custom';
  }

  open() { 
    this.isOpen = true; 
    this.name = '';
    this.color = '#3D62A8';
    this.position = this.maxPosition();
    this.selectedStatusId = null;
    this.selectedStatusName = '';
    this.statusSearchQuery = '';
    this.showStatusDropdown = false;

    // Load existing statuses from backend when modal opens
    const board = this.store.currentBoard();
    const projectId = board?.projectId;
    if (projectId) {
      console.log('[AddColumnButton] Loading existing statuses for project:', projectId);
      this.statusApiService.getStatusesByProject(String(projectId)).subscribe({
        next: (statuses) => {
          console.log('[AddColumnButton] Loaded statuses:', statuses);
          this.existingStatuses.set(statuses);
        },
        error: (err) => {
          console.error('[AddColumnButton] Error loading statuses:', err);
          // Continue without loaded statuses (presets will still work)
        }
      });
    }
  }
  
  close() { 
    this.isOpen = false; 
    this.name = ''; 
    this.color = '#3D62A8';
    this.position = 1;
    this.selectedStatusId = null;
    this.selectedStatusName = '';
    this.statusSearchQuery = '';
    this.showStatusDropdown = false;
  }

  onStatusInputFocus() {
    this.showStatusDropdown = true;
  }

  onStatusInputBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      this.showStatusDropdown = false;
    }, 200);
  }

  closeStatusDropdown() {
    this.showStatusDropdown = false;
  }

  onStatusSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value || '';
    // Keep raw input for display, but matching is case-insensitive
    this.statusSearchQuery = value;
    this.showStatusDropdown = true;
  }

  selectStatus(status: { id: number; statusName: string; label: string; isExisting: boolean } | string) {
    if (typeof status === 'string') {
      // free-text fallback
      this.selectedStatusId = null;
      this.selectedStatusName = this.codeFromInput(status);
      this.statusSearchQuery = status;
    } else {
      // selected from backend list
      this.selectedStatusId = (status as any).id;
      this.selectedStatusName = (status as any).statusName;
      this.statusSearchQuery = (status as any).label;
    }
    this.showStatusDropdown = false;
  }

  useNewStatus() {
    const raw = this.statusSearchQuery.trim();
    if (!raw) return;
    const code = this.codeFromInput(raw);
    const label = this.humanizeLabel(code);
    this.selectedStatusId = null;
    this.selectedStatusName = code;
    this.statusSearchQuery = label;
    this.showStatusDropdown = false;
  }

  // Convert free input into canonical code (UPPERCASE_WITH_UNDERSCORES)
  private codeFromInput(input: string): string {
    // Prefer preset canonical code when input matches a preset (e.g., "todo" -> "TO_DO")
    const preset = this.getPresetCodeFromInput(input);
    if (preset) return preset;

    return input
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toUpperCase();
  }

  // Convert code like IN_PROGRESS to human label 'In Progress'
  private humanizeLabel(code: string): string {
    return code
      .toLowerCase()
      .replace(/_/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  isValid(): boolean {
    return this.name.trim().length > 0 && 
           this.isValidHexColor(this.color) &&
           this.position > 0 &&
           this.position <= this.maxPosition();
  }

  isValidHexColor(hex: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  }

  validateHexColor(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    // Ensure it starts with #
    if (!value.startsWith('#')) {
      value = '#' + value.replace(/^#+/, '');
    }
    
    // Remove invalid characters
    value = value.replace(/[^#0-9A-Fa-f]/g, '');
    
    // Limit to 7 characters (#RRGGBB)
    if (value.length > 7) {
      value = value.substring(0, 7);
    }
    
    this.color = value.toUpperCase();
  }

  async addColumn() {
    if (!this.isValid()) return;
    this.error = null;
    
    // Determine final statusName to send to backend
    let finalStatusCode = '';
    let finalStatusId: number | null = null;
    
    if (this.selectedStatusId) {
      // User selected an existing status; use its canonical name and id
      finalStatusCode = this.selectedStatusName;
      finalStatusId = this.selectedStatusId;
    } else if (this.selectedStatusName) {
      // User selected/entered a status name (new or normalized)
      finalStatusCode = this.selectedStatusName;
    } else if (this.statusSearchQuery.trim()) {
      // User typed something but didn't explicitly pick - try to match existing status first
      const matchedStatus = this.findMatchingStatus(this.statusSearchQuery.trim());
      if (matchedStatus) {
        console.log('[AddColumnButton] Matched existing status:', matchedStatus.statusName);
        finalStatusCode = matchedStatus.statusName;
        finalStatusId = matchedStatus.id;
      } else {
        // No match found - normalize it to create new status
        finalStatusCode = this.codeFromInput(this.statusSearchQuery.trim());
        console.log('[AddColumnButton] Creating new status:', finalStatusCode);
      }
    }
    
    // Normalize column name for consistent storage
    const normalizedName = this.name.trim();

    const board = this.store.currentBoard();
    
    // Check for duplicate statusId in current board columns
    if (finalStatusId && board) {
      const existingColumn = board.columns.find(col => col.statusId === finalStatusId);
      if (existingColumn) {
        this.toastService.error(`A column with this status already exists: "${existingColumn.title}"`);
        this.error = `A column with this status already exists: "${existingColumn.title}"`;
        return;
      }
    }

    // If we have a board context, call backend API to create column for that board
    if (board && board.id) {
      try {
        this.isLoading = true;
        const success = await this.boardService.createColumnApi(
          String(board.id), 
          normalizedName, 
          this.color, 
          finalStatusCode, 
          this.position
        );
        if (success) {
          // Refresh local board columns in the store
          await this.store.loadBoard(String(board.id));
          
          // If this is not the default board, sync the new column to default board
          if (board.projectId && !board.isDefault) {
            try {
              const updatedBoard = this.store.currentBoard();
              if (updatedBoard) {
                await this.boardService.syncColumnsToDefaultBoard(board.projectId, updatedBoard);
              }
            } catch (syncError) {
              console.error('[AddColumnButton] Failed to sync column to default board:', syncError);
              // Don't block the UI - column was created successfully
            }
          }
          
          this.close();
        } else {
          this.error = 'Failed to create column on server';
        }
      } catch (err) {
        console.error('[AddColumnButton] Error calling createColumnApi', err);
        this.error = 'Error creating column';
      } finally {
        this.isLoading = false;
      }
    } else {
      // Fallback: create column locally when no board context exists
      const id = normalizedName.toUpperCase().replace(/\s+/g, '_');
      this.store.addColumn({
        id: id as any,
        title: normalizedName,
        color: this.color,
        position: this.position,
        status: finalStatusCode || undefined
      });
      this.close();
    }
  }
}
