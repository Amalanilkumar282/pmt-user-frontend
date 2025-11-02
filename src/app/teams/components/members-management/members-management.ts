import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectMembersService } from '../../services/project-members.service';
import { ProjectContextService } from '../../../shared/services/project-context.service';
import { MemberCard } from '../member-card/member-card';
import { AddMemberForm } from '../add-member-form/add-member-form';
import { ProjectMember, MemberRole } from '../../models/project-member.model';

type ViewMode = 'list' | 'add';

@Component({
  selector: 'app-members-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MemberCard, AddMemberForm],
  templateUrl: './members-management.html',
  styleUrls: ['./members-management.css'],
})
export class MembersManagement {
  private membersService = inject(ProjectMembersService);
  private projectContextService = inject(ProjectContextService);
  private fb = inject(FormBuilder);

  currentProjectId = this.projectContextService.currentProjectId;
  viewMode = signal<ViewMode>('list');
  searchQuery = signal('');
  filterStatus = signal<'all' | 'Active' | 'Inactive'>('all');
  filterTeamStatus = signal<'all' | 'assigned' | 'unassigned'>('all');
  
  // For role change modal
  showRoleModal = signal(false);
  selectedMemberForRoleChange = signal<ProjectMember | null>(null);
  
  availableRoles: MemberRole[] = [
    'Project Manager',
    'Developer',
    'Designer',
    'QA Tester',
    'DevOps',
    'Business Analyst',
  ];

  roleChangeForm = this.fb.group({
    role: ['Developer' as MemberRole, Validators.required],
  });

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
    // Refresh counts after adding a member
    const projectId = this.currentProjectId();
    if (projectId) {
      this.fetchCounts(projectId);
    }
  }

  handleChangeRole(memberId: string): void {
    const member = this.membersService.getMemberById(memberId);
    if (member) {
      this.selectedMemberForRoleChange.set(member);
      this.roleChangeForm.patchValue({ role: member.role });
      this.showRoleModal.set(true);
    }
  }

  submitRoleChange(): void {
    if (this.roleChangeForm.valid && this.selectedMemberForRoleChange()) {
      const newRole = this.roleChangeForm.value.role!;
      const member = this.selectedMemberForRoleChange()!;
      
      this.membersService.updateMember(member.id, { role: newRole });
      this.closeRoleModal();
    }
  }

  closeRoleModal(): void {
    this.showRoleModal.set(false);
    this.selectedMemberForRoleChange.set(null);
    this.roleChangeForm.reset({ role: 'Developer' });
  }

  handleRemoveMember(memberId: string): void {
    const member = this.membersService.getMemberById(memberId);
    if (!member) return;

    const confirmMessage = member.teamId
      ? `Remove ${member.userName} from the project? They will also be removed from their team.`
      : `Remove ${member.userName} from the project?`;

    if (confirm(confirmMessage)) {
      this.membersService.removeMember(memberId);
      // Refresh counts after removal
      const projectId = this.currentProjectId();
      if (projectId) {
        this.fetchCounts(projectId);
      }
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
