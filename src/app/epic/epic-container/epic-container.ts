import { Component, Output, EventEmitter, inject, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EpicList } from '../epic-list/epic-list';
import { Epic, CreateEpicRequest } from '../../shared/models/epic.model';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { EpicService } from '../../shared/services/epic.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-epic-container',
  standalone: true,
  imports: [CommonModule, FormsModule, EpicList],
  templateUrl: './epic-container.html',
  styleUrl: './epic-container.css',
})
export class EpicContainer implements OnInit, OnChanges {
  @Input() projectId: string = '';
  
  epics: Epic[] = [];
  isCreating = false;
  newEpicName = '';
  isLoading = false;
  
  private sidebarStateService = inject(SidebarStateService);
  private epicService = inject(EpicService);
  private toastService = inject(ToastService);

  @Output() epicSelected = new EventEmitter<string>();
  @Output() closeEpicPanel = new EventEmitter<void>();
  @Output() viewDetails = new EventEmitter<string>();
  @Output() epicCreated = new EventEmitter<Epic>();

  ngOnInit(): void {
    this.loadEpics();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload epics when projectId changes
    if (changes['projectId'] && !changes['projectId'].firstChange) {
      this.loadEpics();
    }
  }

  isSidebarCollapsed(): boolean {
    return this.sidebarStateService.getCollapsed();
  }

  /**
   * Load epics from backend by project ID
   */
  loadEpics(): void {
    if (!this.projectId) {
      // Try to get project ID from session storage
      if (typeof sessionStorage !== 'undefined') {
        this.projectId = sessionStorage.getItem('projectId') || '';
      }
    }

    if (!this.projectId) {
      console.warn('⚠️ [EpicContainer] No project ID available');
      return;
    }

    this.isLoading = true;
    this.epicService.getAllEpicsByProject(this.projectId).subscribe({
      next: (epics) => {
        this.epics = epics.map(epic => ({
          ...epic,
          isExpanded: false
        }));
        this.isLoading = false;
        console.log('✅ [EpicContainer] Loaded epics:', this.epics);
      },
      error: (error) => {
        console.error('❌ [EpicContainer] Error loading epics:', error);
        this.isLoading = false;
        this.toastService.error('Failed to load epics');
      }
    });
  }

  onToggleExpand(epicId: string): void {
    this.epics = this.epics.map((epic) =>
      epic.id === epicId ? { ...epic, isExpanded: !epic.isExpanded } : epic
    );
  }

  onViewDetails(epicId: string): void {
    this.viewDetails.emit(epicId);
  }

  startCreatingEpic(): void {
    this.isCreating = true;
    this.newEpicName = '';
    // Focus on input after a brief delay to ensure it's rendered
    setTimeout(() => {
      const input = document.querySelector('.epic-name-input') as HTMLInputElement;
      if (input) input.focus();
    }, 0);
  }

  cancelCreatingEpic(): void {
    if (!this.newEpicName.trim()) {
      this.isCreating = false;
      this.newEpicName = '';
    }
  }

  createEpic(): void {
    if (!this.newEpicName.trim()) {
      this.toastService.error('Epic name is required');
      return;
    }

    if (!this.projectId) {
      this.toastService.error('Project ID is not available');
      return;
    }

    const userId = this.epicService.getCurrentUserId() || 1; // Default to 1 if not available

    const epicRequest: CreateEpicRequest = {
      projectId: this.projectId,
      title: this.newEpicName.trim(),
      description: '',
      startDate: null,
      dueDate: null,
      assigneeId: userId,
      reporterId: userId,
      labels: []
    };

    this.epicService.createEpic(epicRequest).subscribe({
      next: (newEpic) => {
        this.epics.push({
          ...newEpic,
          isExpanded: true
        });
        this.epicCreated.emit(newEpic);
        this.isCreating = false;
        this.newEpicName = '';
        this.toastService.success('Epic created successfully');
        console.log('✅ [EpicContainer] Epic created:', newEpic);
      },
      error: (error) => {
        console.error('❌ [EpicContainer] Error creating epic:', error);
        this.toastService.error('Failed to create epic');
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.createEpic();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.isCreating = false;
      this.newEpicName = '';
    }
  }

  onInputBlur(): void {
    // Delay to allow click events to fire first
    setTimeout(() => {
      this.cancelCreatingEpic();
    }, 200);
  }

  onClose(): void {
    this.closeEpicPanel.emit();
  }
}
