import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectMembersService } from '../../services/project-members.service';
import { ProjectContextService } from '../../../shared/services/project-context.service';
import { MemberCard } from '../member-card/member-card';
import { AddMemberForm } from '../add-member-form/add-member-form';
import { ProjectMember } from '../../models/project-member.model';
import { RoleService, Role } from '../../../shared/services/role.service';
import { UserService } from '../../../shared/services/user.service';
import { PermissionService } from '../../../auth/permission.service';
import { HasPermissionDirective } from '../../../auth/has-permission.directive';

type ViewMode = 'list' | 'add';

@Component({
  selector: 'app-members-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MemberCard, AddMemberForm, HasPermissionDirective],
  templateUrl: './members-management.html',
  styleUrls: ['./members-management.css'],
})
export class MembersManagement implements OnInit {
  private membersService = inject(ProjectMembersService);
  private projectContextService = inject(ProjectContextService);
  private roleService = inject(RoleService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  
  // Inject permission service
  permissionService = inject(PermissionService);

  currentProjectId = this.projectContextService.currentProjectId;
  viewMode = signal<ViewMode>('list');
  searchQuery = signal('');
  filterStatus = signal<'all' | 'Active' | 'Inactive'>('all');
  filterTeamStatus = signal<'all' | 'assigned' | 'unassigned'>('all');
  
  // For role change modal
  showRoleModal = signal(false);
  selectedMemberForRoleChange = signal<ProjectMember | null>(null);
  
  // Dynamic roles from backend
  availableRoles = signal<Role[]>([]);
  rolesLoading = signal(false);

  roleChangeForm = this.fb.group({
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
    
    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        this.availableRoles.set(roles);
        this.rolesLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load roles:', error);
        this.rolesLoading.set(false);
      }
    });
  }
  
  /**
   * Load users from backend API
   */
  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log('✅ Users loaded successfully in members management:', users.length, 'users');
      },
      error: (error) => {
        console.error('Failed to load users in members management:', error);
      }
    });
  }

  // Get all project members
  projectMembers = computed(() => {
    const projectId = this.currentProjectId();
    if (!projectId) return [];
    return this.membersService.getMembersByProject(projectId);
  });

  // Filtered members
  filteredMembers = computed(() => {
    let members = this.projectMembers();
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    const teamStatus = this.filterTeamStatus();

    // Filter by status
    if (status !== 'all') {
      members = members.filter(m => m.status === status);
    }

    // Filter by team assignment
    if (teamStatus === 'assigned') {
      members = members.filter(m => !!m.teamId);
    } else if (teamStatus === 'unassigned') {
      members = members.filter(m => !m.teamId);
    }

    // Filter by search query
    if (query) {
      members = members.filter(
        m =>
          m.userName.toLowerCase().includes(query) ||
          m.userEmail.toLowerCase().includes(query) ||
          m.role.toLowerCase().includes(query) ||
          m.teamName?.toLowerCase().includes(query)
      );
    }

    return members;
  });

  // Statistics (sourced from backend API)
  totalMembers = signal<number>(0);
  activeMembers = signal<number>(0);
  unassignedMembers = signal<number>(0);

  // Refresh counts when project changes
  private refreshCountsEffect = effect(() => {
    const projectId = this.currentProjectId();
    if (projectId) {
      // Fetch members and counts from API when project changes
      this.membersService.fetchMembersFromApi(projectId).subscribe({
        next: () => {
          // After members are updated, fetch counts as well
          this.fetchCounts(projectId);
        },
        error: (err) => {
          console.error('Error fetching members for project:', err);
        }
      });
    } else {
      // Clear counts when no project selected
      this.totalMembers.set(0);
      this.activeMembers.set(0);
      this.unassignedMembers.set(0);
    }
  });

  showAddForm(): void {
    this.viewMode.set('add');
  }

  showList(): void {
    this.viewMode.set('list');
  }

  handleMemberAdded(): void {
    this.showList();
    // Refresh counts and members list after adding a member
    const projectId = this.currentProjectId();
    if (projectId) {
      this.fetchCounts(projectId);
      
      // Refresh members list from API to ensure role is displayed correctly
      this.membersService.fetchMembersFromApi(projectId).subscribe({
        next: (members) => {
          console.log('✅ Members list refreshed after adding new member');
        },
        error: (error) => {
          console.error('❌ Failed to refresh members list:', error);
        }
      });
    }
  }

  handleChangeRole(memberId: string): void {
    const member = this.membersService.getMemberById(memberId);
    if (member) {
      this.selectedMemberForRoleChange.set(member);
      this.roleChangeForm.patchValue({ roleId: member.roleId });
      this.showRoleModal.set(true);
    }
  }

  submitRoleChange(): void {
    if (this.roleChangeForm.valid && this.selectedMemberForRoleChange()) {
      const newRoleId = this.roleChangeForm.value.roleId!;
      const member = this.selectedMemberForRoleChange()!;
      const projectId = this.currentProjectId();
      
      if (!projectId) {
        alert('Project ID not found. Please refresh the page.');
        return;
      }

      // Call the API to update the member
      this.membersService.updateProjectMember({
        projectId: projectId,
        id: Number(member.id), // projectMemberId
        userId: Number(member.userId),
        roleId: newRoleId
      }).subscribe({
        next: (updatedMember) => {
          console.log('✅ Member role updated successfully:', updatedMember);
          this.closeRoleModal();
          
          // Refresh the members list from API
          this.membersService.fetchMembersFromApi(projectId).subscribe({
            next: (members) => {
              console.log('✅ Members list refreshed after role update');
            },
            error: (error) => {
              console.error('❌ Failed to refresh members list:', error);
            }
          });
        },
        error: (error) => {
          console.error('❌ Failed to update member role:', error);
          alert('Failed to update member role. Please try again.');
        }
      });
    }
  }

  closeRoleModal(): void {
    this.showRoleModal.set(false);
    this.selectedMemberForRoleChange.set(null);
    const defaultRoleId = this.availableRoles().length > 0 ? this.availableRoles()[0].id : 0;
    this.roleChangeForm.reset({ roleId: defaultRoleId });
  }

  handleRemoveMember(memberId: string): void {
    const member = this.membersService.getMemberById(memberId);
    if (!member) return;

    const projectId = this.currentProjectId();
    if (!projectId) {
      alert('Project ID not found. Please refresh the page.');
      return;
    }

    const confirmMessage = member.teamId
      ? `Remove ${member.userName} from the project? They will also be removed from their team.`
      : `Remove ${member.userName} from the project?`;

    if (confirm(confirmMessage)) {
      // Call the API to delete the member
      this.membersService.deleteProjectMember(projectId, Number(member.userId)).subscribe({
        next: (response) => {
          console.log('✅ Member removed successfully:', response);
          
          // Refresh counts after removal
          this.fetchCounts(projectId);
          
          // Refresh the members list from API
          this.membersService.fetchMembersFromApi(projectId).subscribe({
            next: (members) => {
              console.log('✅ Members list refreshed after removal');
            },
            error: (error) => {
              console.error('❌ Failed to refresh members list:', error);
            }
          });
        },
        error: (error) => {
          console.error('❌ Failed to remove member:', error);
          alert('Failed to remove member. Please try again.');
        }
      });
    }
  }

  private fetchCounts(projectId: string): void {
    this.membersService.getMemberCountsFromApi(projectId).subscribe({
      next: (counts) => {
        this.totalMembers.set(counts.totalMembers);
        this.activeMembers.set(counts.activeMembers);
        this.unassignedMembers.set(counts.unassignedMembers);
      },
      error: (err) => {
        console.error('Error fetching member counts:', err);
      }
    });
  }

  setFilterStatus(status: 'all' | 'Active' | 'Inactive'): void {
    this.filterStatus.set(status);
  }

  setFilterTeamStatus(status: 'all' | 'assigned' | 'unassigned'): void {
    this.filterTeamStatus.set(status);
  }

  updateSearchQuery(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      'Project Manager': '#8b5cf6',
      'Developer': '#3b82f6',
      'Designer': '#ec4899',
      'QA Tester': '#f59e0b',
      'DevOps': '#10b981',
      'Business Analyst': '#06b6d4',
    };
    return colors[role] || '#6b7280';
  }
}
