import { Injectable, signal, computed, inject } from '@angular/core';
import { Team, TeamMember, CreateTeamDto, UpdateTeamDto, TeamStats } from '../models/team.model';
import { users } from '../../shared/data/dummy-backlog-data';
import { ProjectMembersService } from './project-members.service';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  private projectMembersService = inject(ProjectMembersService);

  // Signal-based state management
  private teamsSignal = signal<Team[]>(this.getInitialTeams());
  private selectedTeamIdSignal = signal<string | null>(null);

  // Public computed signals
  teams = this.teamsSignal.asReadonly();
  selectedTeamId = this.selectedTeamIdSignal.asReadonly();
  
  selectedTeam = computed(() => {
    const id = this.selectedTeamIdSignal();
    return id ? this.teamsSignal().find(t => t.id === id) : null;
  });

  activeTeams = computed(() => 
    this.teamsSignal().filter(t => t.status === 'Active')
  );

  // Get all available members from users data (for backward compatibility)
  getAvailableMembers(): TeamMember[] {
    return users
      .filter(user => user.id !== 'user-8') // Exclude 'Unassigned'
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'Developer' as const,
        joinedDate: new Date().toISOString(),
      }));
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
  createTeam(dto: CreateTeamDto): Team {
    const availableMembers = this.getAvailableMembers();
    const lead = availableMembers.find(m => m.id === dto.leadId);
    const members = availableMembers.filter(m => dto.memberIds.includes(m.id));

    if (!lead) {
      throw new Error('Team lead not found');
    }

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: dto.name,
      description: dto.description,
      projectId: dto.projectId,
      projectName: this.getProjectName(dto.projectId),
      lead,
      members: [lead, ...members.filter(m => m.id !== lead.id)],
      activeSprints: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Active',
      tags: dto.tags || [],
    };

    this.teamsSignal.update(teams => [...teams, newTeam]);
    return newTeam;
  }

  updateTeam(id: string, dto: UpdateTeamDto): Team | null {
    const teamIndex = this.teamsSignal().findIndex(t => t.id === id);
    if (teamIndex === -1) return null;

    this.teamsSignal.update(teams => {
      const updated = [...teams];
      const team = { ...updated[teamIndex] };

      if (dto.name) team.name = dto.name;
      if (dto.description) team.description = dto.description;
      if (dto.status) team.status = dto.status;
      if (dto.tags) team.tags = dto.tags;

      if (dto.leadId) {
        const availableMembers = this.getAvailableMembers();
        const newLead = availableMembers.find(m => m.id === dto.leadId);
        if (newLead) team.lead = newLead;
      }

      if (dto.memberIds) {
        const availableMembers = this.getAvailableMembers();
        team.members = [
          team.lead,
          ...availableMembers.filter(m => 
            dto.memberIds!.includes(m.id) && m.id !== team.lead.id
          )
        ];
      }

      team.updatedAt = new Date().toISOString();
      updated[teamIndex] = team;
      return updated;
    });

    return this.teamsSignal()[teamIndex];
  }

  deleteTeam(id: string): boolean {
    const initialLength = this.teamsSignal().length;
    this.teamsSignal.update(teams => teams.filter(t => t.id !== id));
    
    if (this.selectedTeamIdSignal() === id) {
      this.selectedTeamIdSignal.set(null);
    }
    
    return this.teamsSignal().length < initialLength;
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
    const availableMembers = this.getAvailableMembers();
    
    return [
      {
        id: 'team-1',
        name: 'Frontend Development Team',
        description: 'Responsible for all frontend development tasks including UI/UX implementation',
        projectId: '1',
        projectName: 'Website Redesign',
        lead: availableMembers[0], // Amal A
        members: [availableMembers[0], availableMembers[1], availableMembers[2]],
        activeSprints: ['sprint-1', 'sprint-2'],
        createdAt: '2024-10-01T10:00:00Z',
        updatedAt: '2024-10-14T10:00:00Z',
        status: 'Active',
        tags: ['Frontend', 'UI/UX'],
      },
      {
        id: 'team-2',
        name: 'Backend API Team',
        description: 'Handles backend services, APIs, and database management',
        projectId: '4',
        projectName: 'Backend Infrastructure',
        lead: availableMembers[3], // Harrel Alex
        members: [availableMembers[3], availableMembers[4], availableMembers[5]],
        activeSprints: ['sprint-3'],
        createdAt: '2024-09-15T10:00:00Z',
        updatedAt: '2024-10-12T10:00:00Z',
        status: 'Active',
        tags: ['Backend', 'API', 'Database'],
      },
      {
        id: 'team-3',
        name: 'Mobile Development Team',
        description: 'Cross-platform mobile application development',
        projectId: '2',
        projectName: 'Mobile App Development',
        lead: availableMembers[1], // Kiran Paulson
        members: [availableMembers[1], availableMembers[6]],
        activeSprints: [],
        createdAt: '2024-08-20T10:00:00Z',
        updatedAt: '2024-10-10T10:00:00Z',
        status: 'Active',
        tags: ['Mobile', 'Cross-platform'],
      },
      {
        id: 'team-4',
        name: 'QA & Testing Team',
        description: 'Quality assurance and automated testing',
        projectId: '1',
        projectName: 'Website Redesign',
        lead: availableMembers[2], // Kavya S
        members: [availableMembers[2], availableMembers[5]],
        activeSprints: ['sprint-1'],
        createdAt: '2024-07-10T10:00:00Z',
        updatedAt: '2024-10-05T10:00:00Z',
        status: 'Inactive',
        tags: ['QA', 'Testing', 'Automation'],
      },
    ];
  }
}
