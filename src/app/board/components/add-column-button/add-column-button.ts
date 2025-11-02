import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../board-store';
import { IssueStatus } from '../../../shared/models/issue.model';
import { BoardService } from '../../services/board.service';
import { StatusApiService, Status } from '../../services/status-api.service';

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
  
  isOpen = false;
  name = '';
  color = '#3D62A8'; // Default to primary color
  position = 1; // Default position
  selectedStatus: string = ''; // Selected or new status
  statusSearchQuery = ''; // Search query for status
  showStatusDropdown = false; // Show/hide status dropdown
  isLoading = false;
  error: string | null = null;

  // Existing statuses from backend (loaded when modal opens)
  private existingStatuses = signal<Status[]>([]);

  // Available statuses for dropdown (canonical code + human label)
  private STATUS_PRESETS: { code: IssueStatus; label: string }[] = [
    { code: 'TODO', label: 'To Do' },
    { code: 'IN_PROGRESS', label: 'In Progress' },
    { code: 'BLOCKED', label: 'Blocked' },
    { code: 'IN_REVIEW', label: 'In Review' },
    { code: 'DONE', label: 'Done' }
  ];

  // Get current columns to determine max position
  currentColumns = computed(() => this.store.columns());
  
  // Get max position for validation
  maxPosition = computed(() => {
    const columns = this.currentColumns();
    return columns.length > 0 ? Math.max(...columns.map(c => c.position)) + 1 : 1;
  });

  // Merge presets with loaded statuses for dropdown
  availableStatuses = computed(() => {
    const loaded = this.existingStatuses();
    const presetCodes = new Set(this.STATUS_PRESETS.map(p => p.code));
    
    // Convert loaded statuses to dropdown format
    const loadedOptions = loaded
      .filter(status => !presetCodes.has(status.statusName as IssueStatus))
      .map(status => ({
        code: status.statusName as IssueStatus,
        label: this.humanizeLabel(status.statusName),
        isExisting: true
      }));

    // Add presets with isExisting flag
    const presetOptions = this.STATUS_PRESETS.map(p => ({
      code: p.code,
      label: p.label,
      isExisting: false
    }));

    return [...presetOptions, ...loadedOptions];
  });

  // Normalize status name for case/space insensitive comparison
  private getNormalizedKey(input: string): string {
    return input.trim().toLowerCase().replace(/[\s_]+/g, '');
  }

  // Find matching existing status by normalized comparison
  private findMatchingStatus(input: string): Status | null {
    const normalized = this.getNormalizedKey(input);
    return this.existingStatuses().find(s => 
      this.getNormalizedKey(s.statusName) === normalized
    ) || null;
  }

  // Filtered statuses (returns preset + loaded objects) based on case-insensitive search
  get filteredStatuses(): { code: IssueStatus; label: string; isExisting?: boolean }[] {
    const q = this.statusSearchQuery.trim().toLowerCase();
    const available = this.availableStatuses();
    if (!q) return available;
    return available.filter(s => {
      return s.label.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    });
  }

  // Check if the entered status is new (not in existing statuses OR presets)
  get isNewStatus(): boolean {
    const q = this.statusSearchQuery.trim();
    if (!q) return false;
    
    // Check against both presets and loaded statuses
    const matchesPreset = this.STATUS_PRESETS.some(s => 
      this.getNormalizedKey(s.label) === this.getNormalizedKey(q) ||
      this.getNormalizedKey(s.code) === this.getNormalizedKey(q)
    );
    
    const matchesExisting = this.findMatchingStatus(q) !== null;
    
    return !matchesPreset && !matchesExisting;
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
    this.selectedStatus = '';
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
    this.selectedStatus = '';
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

  selectStatus(status: { code: IssueStatus; label: string; isExisting?: boolean } | string) {
    if (typeof status === 'string') {
      const found = this.STATUS_PRESETS.find(s => s.label === status || s.code === status);
      if (found) {
        this.selectedStatus = found.code;
        this.statusSearchQuery = found.label;
      } else {
        // Fallback to raw
        this.selectedStatus = status as any;
        this.statusSearchQuery = status;
      }
    } else {
      this.selectedStatus = status.code;
      this.statusSearchQuery = status.label;
    }
    this.showStatusDropdown = false;
  }

  useNewStatus() {
    const raw = this.statusSearchQuery.trim();
    if (!raw) return;
    const code = this.codeFromInput(raw);
    const label = this.humanizeLabel(code);
    this.selectedStatus = code;
    this.statusSearchQuery = label;
    this.showStatusDropdown = false;
  }

  // Convert free input into canonical code (UPPERCASE_WITH_UNDERSCORES)
  private codeFromInput(input: string): string {
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
    
    // Smart status matching: check if user input matches existing status
    let finalStatusCode = '';
    if (this.selectedStatus) {
      // selectedStatus already contains the canonical code from selectStatus or useNewStatus
      finalStatusCode = this.selectedStatus;
    } else if (this.statusSearchQuery.trim()) {
      // User typed something but didn't select - try to match existing status first
      const matchedStatus = this.findMatchingStatus(this.statusSearchQuery.trim());
      if (matchedStatus) {
        console.log('[AddColumnButton] Matched existing status:', matchedStatus.statusName);
        finalStatusCode = matchedStatus.statusName;
      } else {
        // No match found - normalize it to create new status
        finalStatusCode = this.codeFromInput(this.statusSearchQuery.trim());
        console.log('[AddColumnButton] Creating new status:', finalStatusCode);
      }
    }
    
    // Normalize column name for consistent storage
    const normalizedName = this.name.trim();

    const board = this.store.currentBoard();

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
          this.store.loadBoard(String(board.id));
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
