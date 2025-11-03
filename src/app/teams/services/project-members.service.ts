import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { ProjectMember, AddMemberDto, UpdateMemberDto, MemberSearchResult } from '../models/project-member.model';
import { users } from '../../shared/data/dummy-backlog-data';
import { RoleService } from '../../shared/services/role.service';
import { UserService } from '../../shared/services/user.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectMembersService {
  // Signal-based state
  private membersSignal = signal<ProjectMember[]>(this.getInitialMembers());
  private http = inject(HttpClient);
  private roleService = inject(RoleService);
  private userService = inject(UserService);
  private readonly API_BASE_URL = 'https://localhost:7117/api';
  
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

  /**
   * Search all available users from backend API
   * @param query - Search query string
   * @param currentProjectId - Current project ID to check if user is already a member
   * @returns Array of user search results
   */
  searchUsers(query: string, currentProjectId: string): MemberSearchResult[] {
    const projectMembers = this.getMembersByProject(currentProjectId);
    const memberUserIds = new Set(projectMembers.map(m => m.userId));
    
    // Search from cached users in UserService
    const searchResults = this.userService.searchUsers(query);
    
    return searchResults.map(u => ({
      id: String(u.id),
      name: u.name,
      email: u.email,
      avatar: u.avatarUrl,
      alreadyInProject: memberUserIds.has(String(u.id)),
    }));
  }

  /**
   * Get all available users from backend API
   * @returns Array of all user search results
   */
  getAllAvailableUsers(): MemberSearchResult[] {
    const allUsers = this.userService.users();
    
    return allUsers.map(u => ({
      id: String(u.id),
      name: u.name,
      email: u.email,
      avatar: u.avatarUrl,
    }));
  }

  /**
   * Add member to project via backend API
   * @param dto - Add member data transfer object
   * @returns Observable of the added project member
   */
  addMemberToProject(dto: AddMemberDto): Observable<ProjectMember> {
    // Get current user ID from session storage (addedBy)
    const addedBy = parseInt(sessionStorage.getItem('userId') || '0', 10);
    
    if (addedBy === 0) {
      return throwError(() => new Error('User not logged in'));
    }

    // Prepare the request body for the API
    const requestBody = {
      projectId: dto.projectId,
      userId: Number(dto.userId),
      roleId: dto.roleId,
      addedBy: addedBy
    };

    console.log('📤 Adding member to project:', requestBody);

    const headers = this.getAuthHeaders();
    
    return this.http.post<any>(`${this.API_BASE_URL}/Project/member`, requestBody, { headers }).pipe(
      map((response) => {
        console.log('✅ Add member API response:', response);
        
        // Get user data from cached users
        const apiUser = this.userService.getUserById(Number(dto.userId));
        const roleName = this.roleService.getRoleName(dto.roleId);

        // Create the ProjectMember object
        const newMember: ProjectMember = {
          id: response.data?.id || `member-${Date.now()}`,
          userId: String(dto.userId),
          userName: apiUser?.name || 'Unknown User',
          userEmail: apiUser?.email || '',
          projectId: dto.projectId,
          projectName: this.getProjectName(dto.projectId),
          role: roleName as any,
          roleId: dto.roleId,
          status: 'Active',
          joinedDate: new Date().toISOString(),
          avatar: apiUser?.avatarUrl,
        };

        // Update local state
        this.membersSignal.update(members => [...members, newMember]);
        
        return newMember;
      }),
      catchError((error) => {
        console.error('❌ Failed to add member:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to add member to project'));
      })
    );
  }

  // Legacy synchronous method (kept for backward compatibility)
  addMember(dto: AddMemberDto): ProjectMember {
    // Try to find user from backend API first
    const apiUser = this.userService.getUserById(Number(dto.userId));
    
    // Fallback to dummy data if API user not found
    const dummyUser = users.find(u => u.id === dto.userId);
    
    if (!apiUser && !dummyUser) {
      throw new Error('User not found');
    }

    // Check if user is already in project
    const existingMember = this.membersSignal().find(
      m => m.userId === dto.userId && m.projectId === dto.projectId
    );
    
    if (existingMember) {
      throw new Error('User is already a member of this project');
    }

    // Get role name from roleId
    const roleName = this.roleService.getRoleName(dto.roleId);

    // Use API user data if available, otherwise use dummy data
    const userData = apiUser ? {
      id: String(apiUser.id),
      name: apiUser.name,
      email: apiUser.email,
      avatar: apiUser.avatarUrl,
    } : {
      id: dummyUser!.id,
      name: dummyUser!.name,
      email: dummyUser!.email,
      avatar: dummyUser!.avatar,
    };

    const newMember: ProjectMember = {
      id: `member-${Date.now()}`,
      userId: userData.id,
      userName: userData.name,
      userEmail: userData.email,
      projectId: dto.projectId,
      projectName: this.getProjectName(dto.projectId),
      role: roleName as any, // Role name for display
      roleId: dto.roleId, // Role ID from backend
      status: 'Active',
      joinedDate: new Date().toISOString(),
      avatar: userData.avatar,
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

      if (dto.roleId) {
        member.roleId = dto.roleId;
        member.role = this.roleService.getRoleName(dto.roleId) as any;
      }
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
        roleId: 1, // Default roleId for mock data
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
        roleId: 2, // Default roleId for mock data
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
        roleId: 4, // Default roleId for mock data
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
        roleId: 2, // Default roleId for mock data
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
        roleId: 2, // Default roleId for mock data
        status: 'Active',
        joinedDate: '2024-09-10T10:00:00Z',
        // Not assigned to any team yet
      },
    ];
  }

  /**
   * Fetch member counts for a project from backend API
   * Expected response shape: { totalMembers: number, activeMembers: number, unassignedMembers: number }
   */
  getMemberCountsFromApi(projectId: string): Observable<{ totalMembers: number; activeMembers: number; unassignedMembers: number }> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API_BASE_URL}/Team/projects/${projectId}/member-count`, { headers }).pipe(
      map(resp => ({
        totalMembers: resp?.totalMembers ?? resp?.total ?? 0,
        activeMembers: resp?.activeMembers ?? resp?.active ?? 0,
        unassignedMembers: resp?.unassignedMembers ?? resp?.unassigned ?? resp?.unassignedCount ?? 0,
      }))
    );
  }

  /**
   * Fetch project members from backend and update local members signal.
   * Maps API response to ProjectMember[] shape used by the UI.
   */
  fetchMembersFromApi(projectId: string): Observable<ProjectMember[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API_BASE_URL}/User/by-project/${projectId}`, { headers }).pipe(
      map(resp => resp?.data || []),
      map((arr: any[]) => arr.map(item => {
        const teams = Array.isArray(item.teams) ? item.teams : [];
        const teamNames = teams.map((t: any) => t.teamName).filter(Boolean).join(', ');

        // Get roleId from API response, default to 0 if not present
        const roleId = item.roleId !== undefined ? Number(item.roleId) : 0;
        
        // Map roleName to local MemberRole union with safe fallbacks
        const roleName: string = item.roleName || this.roleService.getRoleName(roleId) || '';
        let mappedRole: any = 'Developer';
        if (/project manager/i.test(roleName)) mappedRole = 'Project Manager';
        else if (/qa/i.test(roleName)) mappedRole = 'QA Tester';
        else if (/designer/i.test(roleName)) mappedRole = 'Designer';
        else if (/devops/i.test(roleName)) mappedRole = 'DevOps';
        else if (/business analyst/i.test(roleName)) mappedRole = 'Business Analyst';
        else if (/developer/i.test(roleName)) mappedRole = 'Developer';

        const pm: ProjectMember = {
          id: item.projectMemberId !== undefined ? String(item.projectMemberId) : `pm-${item.id}`,
          userId: item.id !== undefined ? String(item.id) : String(item.projectMemberId || ''),
          userName: item.name || item.userName || '',
          userEmail: item.email || item.userEmail || '',
          projectId: String(projectId),
          projectName: this.getProjectName(String(projectId)),
          role: mappedRole,
          roleId: roleId, // Include roleId from API
          status: item.isActive ? 'Active' : 'Inactive',
          joinedDate: item.addedAt || new Date().toISOString(),
          teamId: teams.length > 0 ? String(teams[0].teamId) : undefined,
          teamName: teamNames || undefined,
          avatar: item.avatarUrl || undefined,
        };

        return pm;
      })),
      tap((members: ProjectMember[]) => {
        // Update local state so other components/readers can use getMembersByProject
        this.membersSignal.set(members);
      })
    );
  }

  /**
   * Build auth headers for API calls (SSR-safe)
   */
  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }
}
