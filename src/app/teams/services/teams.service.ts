import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Team, TeamMember, CreateTeamDto, UpdateTeamDto, TeamStats } from '../models/team.model';
import { users } from '../../shared/data/dummy-backlog-data';
import { ProjectMembersService } from './project-members.service';

export interface TeamCountResponse {
  totalTeams: number;
  activeTeams: number;
  assignedMembersCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  private http = inject(HttpClient);
  private projectMembersService = inject(ProjectMembersService);
  private readonly API_BASE_URL = 'https://localhost:7117/api';

  // Signal-based state management
  private teamsSignal = signal<Team[]>(this.getInitialTeams());
  private selectedTeamIdSignal = signal<string | null>(null);
  private teamCountSignal = signal<TeamCountResponse>({
    totalTeams: 0,
    activeTeams: 0,
    assignedMembersCount: 0
  });

  // Public computed signals
  teams = this.teamsSignal.asReadonly();
  selectedTeamId = this.selectedTeamIdSignal.asReadonly();
  teamCount = this.teamCountSignal.asReadonly();
  
  selectedTeam = computed(() => {
    const id = this.selectedTeamIdSignal();
    return id ? this.teamsSignal().find(t => t.id === id) : null;
  });

  activeTeams = computed(() => 
    this.teamsSignal().filter(t => t.status === 'Active')
  );

  /**
   * Get authentication headers with access token
   */
  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * Fetch team count from API for a given project
   */
  getTeamCount(projectId: string): Observable<TeamCountResponse> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.API_BASE_URL}/Team/count/${projectId}`, { headers }).pipe(
      map((response) => {
        const teamCountData: TeamCountResponse = {
          totalTeams: response.totalTeams || 0,
          activeTeams: response.activeTeams || 0,
          assignedMembersCount: response.assignedMembersCount || 0
        };
        
        // Update the signal with the fetched data
        this.teamCountSignal.set(teamCountData);
        
        return teamCountData;
      })
    );
  }

  /**
   * Fetch all teams from API for a given project
   */
  getTeamsByProjectId(projectId: string): Observable<Team[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.API_BASE_URL}/Team/project/${projectId}`, { headers }).pipe(
      map((response) => {
        console.log('TeamsService - Raw API response:', response);
        
        // Check if response is an array directly or has data property
        const teamsData = Array.isArray(response) ? response : (response.data || []);
        
        if (teamsData && teamsData.length > 0) {
          const teams: Team[] = teamsData.map((team: any, index: number) => ({
            // Use teamId from API
            id: team.teamId || team.id || `team-${index}-${Date.now()}`,
            name: team.teamName || team.name || 'Unnamed Team',
            description: team.description || '',
            projectId: projectId,
            projectName: team.projectName || '',
            lead: {
              // Use email as ID for lead
              id: team.lead?.id || team.lead?.email || '',
              name: team.lead?.name || 'Unknown',
              email: team.lead?.email || '',
              role: 'Team Lead' as const,
              joinedDate: team.createdAt || new Date().toISOString(),
            },
            // Map members array from API
            members: team.members?.map((member: any) => ({
              id: member.id || member.email || '',
              name: member.name || 'Unknown',
              email: member.email || '',
              role: member.role as any || 'Developer',
              joinedDate: member.joinedDate || team.createdAt || new Date().toISOString(),
            })) || [],
            // Keep activeSprints as empty array (for sprint IDs if needed later)
            activeSprints: [],
            // Store the counts from API
            activeSprintsCount: team.activeSprints || 0,
            completedSprintsCount: team.completedSprints || 0,
            createdAt: team.createdAt || new Date().toISOString(),
            updatedAt: team.updatedAt || new Date().toISOString(),
            // Map isActive boolean to status string
            status: team.isActive !== false ? 'Active' : 'Inactive',
            tags: team.tags || [],
          }));
          
          console.log('TeamsService - Mapped teams:', teams);
          
          // Update the signal with the fetched data
          this.teamsSignal.set(teams);
          
          return teams;
        }
        return [];
      })
    );
  }

  /**
   * Fetch project members from API for team lead/member selection
   */
  getProjectMembersFromApi(projectId: string): Observable<TeamMember[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API_BASE_URL}/Project/${projectId}/users`, { headers }).pipe(
      map((response) => {
        const membersData = Array.isArray(response.data) ? response.data : response.data || [];
        return membersData.map((member: any) => ({
          id: member.projectMemberId?.toString() || member.id?.toString(),
          name: member.name,
          email: member.email,
          role: member.roleName || 'Developer',
          avatar: member.avatarUrl || undefined,
          joinedDate: member.addedAt || new Date().toISOString(),
          projectMemberId: member.projectMemberId,
        }));
      })
    );
  }

  // Get available members for a specific project (from ProjectMembersService)
  getProjectMembers(projectId: string): TeamMember[] {
    const projectMembers = this.projectMembersService.getMembersByProject(projectId);
    return projectMembers.map(pm => ({
      id: pm.userId,
      name: pm.userName,
      email: pm.userEmail,
      role: pm.role as any,
      joinedDate: pm.joinedDate,
    }));
  }

  // Get unassigned members for a project (members not in any team)
  getUnassignedProjectMembers(projectId: string): TeamMember[] {
    const unassigned = this.projectMembersService.getUnassignedMembers(projectId);
    return unassigned.map(pm => ({
      id: pm.userId,
      name: pm.userName,
      email: pm.userEmail,
      role: pm.role as any,
      joinedDate: pm.joinedDate,
    }));
  }

  // CRUD Operations
  /**
   * Create team via API
   */
  createTeamApi(dto: CreateTeamDto): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log('TeamsService - Creating team with DTO:', dto);
    console.log('TeamsService - Request headers:', headers);
    return this.http.post<any>(`${this.API_BASE_URL}/Team/create`, dto, { headers });
  }

  createTeam(dto: CreateTeamDto, availableMembers: TeamMember[]): Observable<any> {
    // Call the API to create team
    return this.createTeamApi(dto).pipe(
      map((response) => {
        console.log('Team created successfully:', response);
        // Optionally refresh teams list after creation
        return response;
      })
    );
  }

  updateTeam(id: string, dto: UpdateTeamDto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.API_BASE_URL}/Team/${id}`, dto, { headers });
  }

  /**
   * Delete a team via API and update local state on success.
   * Returns an observable of the HTTP delete response.
   */
  deleteTeam(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.API_BASE_URL}/Team/${id}`, { headers }).pipe(
      tap(() => {
        // Update local state after successful deletion
        this.teamsSignal.update(teams => teams.filter(t => t.id !== id));
        if (this.selectedTeamIdSignal() === id) {
          this.selectedTeamIdSignal.set(null);
        }
      })
    );
  }

  getTeamById(id: string): Team | undefined {
    return this.teamsSignal().find(t => t.id === id);
  }

  getTeamsByProject(projectId: string): Team[] {
    return this.teamsSignal().filter(t => t.projectId === projectId);
  }

  selectTeam(id: string | null): void {
    this.selectedTeamIdSignal.set(id);
  }

  // Get team statistics
  getTeamStats(teamId: string): TeamStats {
    const team = this.getTeamById(teamId);
    if (!team) {
      return {
        totalMembers: 0,
        activeSprints: 0,
        completedSprints: 0,
        totalIssues: 0,
        completedIssues: 0,
        velocity: 0,
      };
    }

    // Mock statistics - in real app, fetch from backend
    return {
      totalMembers: team.members.length,
      activeSprints: team.activeSprints.length,
      completedSprints: Math.floor(Math.random() * 10),
      totalIssues: Math.floor(Math.random() * 100) + 20,
      completedIssues: Math.floor(Math.random() * 80) + 10,
      velocity: Math.floor(Math.random() * 50) + 20,
    };
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

  private getInitialTeams(): Team[] {
    
    return [];
  }
}
