import { Injectable, signal, computed } from '@angular/core';
import { ProjectMember, AddMemberDto, UpdateMemberDto, MemberSearchResult } from '../models/project-member.model';
import { users } from '../../shared/data/dummy-backlog-data';

@Injectable({
  providedIn: 'root',
})
export class ProjectMembersService {
  // Signal-based state
  private membersSignal = signal<ProjectMember[]>(this.getInitialMembers());
  
  // Public computed signals
  members = this.membersSignal.asReadonly();
  
  activeMembers = computed(() => 
    this.membersSignal().filter(m => m.status === 'Active')
  );
  
  // Get members for a specific project
  getMembersByProject(projectId: string): ProjectMember[] {
    return this.membersSignal().filter(m => m.projectId === projectId);
  }

  // Get unassigned members (not in any team) for a project
  getUnassignedMembers(projectId: string): ProjectMember[] {
    return this.membersSignal().filter(
      m => m.projectId === projectId && m.status === 'Active' && !m.teamId
    );
  }

  // Search all available users (mock - will be replaced with backend API)
  searchUsers(query: string, currentProjectId: string): MemberSearchResult[] {
    const projectMembers = this.getMembersByProject(currentProjectId);
    const memberUserIds = new Set(projectMembers.map(m => m.userId));
    
    return users
      .filter(u => u.id !== 'user-8') // Exclude 'Unassigned'
      .filter(u => 
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      )
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        alreadyInProject: memberUserIds.has(u.id),
      }));
  }

  // Get all available users (mock - for dropdown)
  getAllAvailableUsers(): MemberSearchResult[] {
    return users
      .filter(u => u.id !== 'user-8')
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
      }));
  }

  // Add member to project
  addMember(dto: AddMemberDto): ProjectMember {
    const user = users.find(u => u.id === dto.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already in project
    const existingMember = this.membersSignal().find(
      m => m.userId === dto.userId && m.projectId === dto.projectId
    );
    
    if (existingMember) {
      throw new Error('User is already a member of this project');
    }

    const newMember: ProjectMember = {
      id: `member-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      projectId: dto.projectId,
      projectName: this.getProjectName(dto.projectId),
      role: dto.role,
      status: 'Active',
      joinedDate: new Date().toISOString(),
      avatar: user.avatar,
    };

    this.membersSignal.update(members => [...members, newMember]);
    return newMember;
  }

  // Update member
  updateMember(memberId: string, dto: UpdateMemberDto): ProjectMember | null {
    const memberIndex = this.membersSignal().findIndex(m => m.id === memberId);
    if (memberIndex === -1) return null;

    this.membersSignal.update(members => {
      const updated = [...members];
      const member = { ...updated[memberIndex] };

      if (dto.role) member.role = dto.role;
      if (dto.status) member.status = dto.status;
      if (dto.teamId !== undefined) {
        member.teamId = dto.teamId;
        member.teamName = dto.teamId ? this.getTeamName(dto.teamId) : undefined;
      }

      updated[memberIndex] = member;
      return updated;
    });

    return this.membersSignal()[memberIndex];
  }

  // Remove member from project
  removeMember(memberId: string): boolean {
    const initialLength = this.membersSignal().length;
    this.membersSignal.update(members => members.filter(m => m.id !== memberId));
    return this.membersSignal().length < initialLength;
  }

  // Assign member to team
  assignToTeam(memberId: string, teamId: string, teamName: string): boolean {
    return !!this.updateMember(memberId, { teamId, teamName } as any);
  }

  // Unassign member from team
  unassignFromTeam(memberId: string): boolean {
    return !!this.updateMember(memberId, { teamId: undefined } as any);
  }

  // Get member by ID
  getMemberById(memberId: string): ProjectMember | undefined {
    return this.membersSignal().find(m => m.id === memberId);
  }

  // Helper methods
  private getProjectName(projectId: string): string {
    const projectNames: Record<string, string> = {
      '1': 'Website Redesign',
      '2': 'Mobile App Development',
      '3': 'Marketing Campaign',
      '4': 'Backend Infrastructure',
      '5': 'Customer Portal',
    };
    return projectNames[projectId] || 'Unknown Project';
  }

  private getTeamName(teamId: string): string {
    // This would ideally come from TeamsService, but to avoid circular dependency
    // we'll just return a placeholder
    return `Team ${teamId}`;
  }

  // Initialize with some members
  private getInitialMembers(): ProjectMember[] {
    return [
      {
        id: 'member-1',
        userId: 'user-1',
        userName: 'Amal A',
        userEmail: 'amal@example.com',
        projectId: '1',
        projectName: 'Website Redesign',
        role: 'Project Manager',
        status: 'Active',
        joinedDate: '2024-09-01T10:00:00Z',
        teamId: 'team-1',
        teamName: 'Frontend Development Team',
      },
      {
        id: 'member-2',
        userId: 'user-2',
        userName: 'Kiran Paulson',
        userEmail: 'kiran@example.com',
        projectId: '1',
        projectName: 'Website Redesign',
        role: 'Developer',
        status: 'Active',
        joinedDate: '2024-09-01T10:00:00Z',
        teamId: 'team-1',
        teamName: 'Frontend Development Team',
      },
      {
        id: 'member-3',
        userId: 'user-3',
        userName: 'Kavya S',
        userEmail: 'kavya@example.com',
        projectId: '1',
        projectName: 'Website Redesign',
        role: 'QA Tester',
        status: 'Active',
        joinedDate: '2024-09-05T10:00:00Z',
        teamId: 'team-4',
        teamName: 'QA & Testing Team',
      },
      {
        id: 'member-4',
        userId: 'user-4',
        userName: 'Harrel Alex',
        userEmail: 'harrelalex@example.com',
        projectId: '4',
        projectName: 'Backend Infrastructure',
        role: 'Developer',
        status: 'Active',
        joinedDate: '2024-08-20T10:00:00Z',
        teamId: 'team-2',
        teamName: 'Backend API Team',
      },
      {
        id: 'member-5',
        userId: 'user-5',
        userName: 'Sharath Shony',
        userEmail: 'sharath@example.com',
        projectId: '1',
        projectName: 'Website Redesign',
        role: 'Developer',
        status: 'Active',
        joinedDate: '2024-09-10T10:00:00Z',
        // Not assigned to any team yet
      },
    ];
  }
}
