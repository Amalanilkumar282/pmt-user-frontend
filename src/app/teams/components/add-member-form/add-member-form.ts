import { Component, Output, EventEmitter, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectMembersService } from '../../services/project-members.service';
import { AddMemberDto, MemberSearchResult } from '../../models/project-member.model';
import { ProjectContextService } from '../../../shared/services/project-context.service';
import { RoleService, Role } from '../../../shared/services/role.service';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-add-member-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-member-form.html',
  styleUrls: ['./add-member-form.css'],
})
export class AddMemberForm implements OnInit {
  private fb = inject(FormBuilder);
  private membersService = inject(ProjectMembersService);
  private projectContextService = inject(ProjectContextService);
  private roleService = inject(RoleService);
  private userService = inject(UserService);

  @Output() memberAdded = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  currentProjectId = this.projectContextService.currentProjectId;
  
  searchQuery = signal('');
  showDropdown = signal(false);
  selectedUser = signal<MemberSearchResult | null>(null);
  
  // Dynamic roles from backend
  availableRoles = signal<Role[]>([]);
  rolesLoading = signal(false);
  rolesError = signal<string | null>(null);
  
  // Users loading state
  usersLoading = signal(false);
  usersError = signal<string | null>(null);
  
  // Add member loading state
  addingMember = signal(false);

  addMemberForm = this.fb.group({
    userId: ['', Validators.required],
    roleId: [0, [Validators.required, Validators.min(1)]],
  });
  
  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }
  
  /**
   * Load roles from backend API
   */
  loadRoles(): void {
    this.rolesLoading.set(true);
    this.rolesError.set(null);
    
    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        this.availableRoles.set(roles);
        this.rolesLoading.set(false);
        
        // Set default role if available
        if (roles.length > 0) {
          this.addMemberForm.patchValue({ roleId: roles[0].id });
        }
      },
      error: (error) => {
        console.error('Failed to load roles:', error);
        this.rolesError.set(error.message || 'Failed to load roles');
        this.rolesLoading.set(false);
      }
    });
  }
  
  /**
   * Load users from backend API
   */
  loadUsers(): void {
    this.usersLoading.set(true);
    this.usersError.set(null);
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log('✅ Users loaded successfully:', users.length, 'users');
        this.usersLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.usersError.set(error.message || 'Failed to load users');
        this.usersLoading.set(false);
      }
    });
  }

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
        roleId: formValue.roleId!,
      };

      // Set loading state
      this.addingMember.set(true);

      // Call the backend API to add member
      this.membersService.addMemberToProject(dto).subscribe({
        next: (newMember) => {
          console.log('✅ Member added successfully:', newMember);
          this.addingMember.set(false);
          this.memberAdded.emit();
          this.resetForm();
        },
        error: (error) => {
          console.error('❌ Failed to add member:', error);
          this.addingMember.set(false);
          alert(error.message || 'Failed to add member to project');
        }
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.resetForm();
  }

  resetForm(): void {
    const defaultRoleId = this.availableRoles().length > 0 ? this.availableRoles()[0].id : 0;
    this.addMemberForm.reset({ roleId: defaultRoleId });
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
