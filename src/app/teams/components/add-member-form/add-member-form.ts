import { Component, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectMembersService } from '../../services/project-members.service';
import { AddMemberDto, MemberRole, MemberSearchResult } from '../../models/project-member.model';
import { ProjectContextService } from '../../../shared/services/project-context.service';

@Component({
  selector: 'app-add-member-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-member-form.html',
  styleUrls: ['./add-member-form.css'],
})
export class AddMemberForm {
  private fb = inject(FormBuilder);
  private membersService = inject(ProjectMembersService);
  private projectContextService = inject(ProjectContextService);

  @Output() memberAdded = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  currentProjectId = this.projectContextService.currentProjectId;
  
  searchQuery = signal('');
  showDropdown = signal(false);
  selectedUser = signal<MemberSearchResult | null>(null);

  availableRoles: MemberRole[] = [
    'Project Manager',
    'Developer',
    'Designer',
    'QA Tester',
    'DevOps',
    'Business Analyst',
  ];

  addMemberForm = this.fb.group({
    userId: ['', Validators.required],
    role: ['Developer' as MemberRole, Validators.required],
  });

  // Computed search results
  searchResults = computed(() => {
    const query = this.searchQuery();
    if (!query || query.length < 2) return [];
    
    const projectId = this.currentProjectId();
    if (!projectId) return [];
    
    return this.membersService.searchUsers(query, projectId);
  });

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.showDropdown.set(true);
  }

  selectUser(user: MemberSearchResult): void {
    if (user.alreadyInProject) {
      return; // Don't select users already in project
    }
    
    this.selectedUser.set(user);
    this.searchQuery.set(user.name);
    this.showDropdown.set(false);
    this.addMemberForm.patchValue({ userId: user.id });
  }

  clearSelection(): void {
    this.selectedUser.set(null);
    this.searchQuery.set('');
    this.addMemberForm.patchValue({ userId: '' });
  }

  onSubmit(): void {
    if (this.addMemberForm.valid && this.currentProjectId()) {
      const formValue = this.addMemberForm.value;
      const dto: AddMemberDto = {
        userId: formValue.userId!,
        projectId: this.currentProjectId()!,
        role: formValue.role!,
      };

      try {
        this.membersService.addMember(dto);
        this.memberAdded.emit();
        this.resetForm();
      } catch (error: any) {
        alert(error.message || 'Failed to add member');
      }
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.resetForm();
  }

  resetForm(): void {
    this.addMemberForm.reset({ role: 'Developer' });
    this.selectedUser.set(null);
    this.searchQuery.set('');
    this.showDropdown.set(false);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Close dropdown when clicking outside
  onDocumentClick(): void {
    this.showDropdown.set(false);
  }
}
