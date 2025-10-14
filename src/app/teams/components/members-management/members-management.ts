import { Component, inject, signal, computed } from '@angular/core';
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

  // Statistics
  totalMembers = computed(() => this.projectMembers().length);
  activeMembers = computed(() => this.projectMembers().filter(m => m.status === 'Active').length);
  unassignedMembers = computed(() => this.projectMembers().filter(m => !m.teamId).length);

  showAddForm(): void {
    this.viewMode.set('add');
  }

  showList(): void {
    this.viewMode.set('list');
  }

  handleMemberAdded(): void {
    this.showList();
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
    }
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
