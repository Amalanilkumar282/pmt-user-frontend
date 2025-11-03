import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TeamApi, TeamMemberApi } from '../models/api-interfaces';

export interface TeamMember {
  name: string;
  email: string;
  role: string;
}

export interface Team {
  name: string;
  projectName: string;
  description: string;
  isActive: boolean;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
  lead: TeamMember;
  members: TeamMember[];
  memberCount: number;
  activeSprints: number;
  completedSprints: number;
}

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/Team`;

  private getAuthHeaders(): HttpHeaders {
    // Check if running in browser (not SSR)
    if (typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem('accessToken') || '';
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'accept': 'text/plain'
      });
    }
    // SSR fallback - no auth token
    return new HttpHeaders({
      'accept': 'text/plain'
    });
  }

  /**
   * Get all teams by project ID
   * GET /api/Team/project/{projectId}
   */
  getTeamsByProject(projectId: string): Observable<Team[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<TeamApi[]>(`${this.baseUrl}/project/${projectId}`, { headers })
      .pipe(map(response => response.map(team => this.mapTeamApiToTeam(team))));
  }

  /**
   * Get team members with full details by project ID
   * GET /api/Team/project/{projectId}/details
   */
  getTeamMembers(projectId: string): Observable<Team[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<TeamApi[]>(`${this.baseUrl}/project/${projectId}/details`, { headers })
      .pipe(map(response => response.map(team => this.mapTeamApiToTeam(team))));
  }

  /**
   * Map TeamApi to frontend Team model
   */
  private mapTeamApiToTeam(apiTeam: TeamApi): Team {
    return {
      name: apiTeam.teamName,
      projectName: apiTeam.projectName,
      description: apiTeam.description,
      isActive: apiTeam.isActive,
      tags: apiTeam.tags,
      createdAt: new Date(apiTeam.createdAt),
      updatedAt: new Date(apiTeam.updatedAt),
      lead: this.mapTeamMemberApiToTeamMember(apiTeam.lead),
      members: apiTeam.members.map(m => this.mapTeamMemberApiToTeamMember(m)),
      memberCount: apiTeam.memberCount,
      activeSprints: apiTeam.activeSprints,
      completedSprints: apiTeam.completedSprints
    };
  }

  /**
   * Map TeamMemberApi to frontend TeamMember model
   */
  private mapTeamMemberApiToTeamMember(apiMember: TeamMemberApi): TeamMember {
    return {
      name: apiMember.name,
      email: apiMember.email,
      role: apiMember.role
    };
  }
}
