import { Component, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { TeamCard } from '../components/team-card/team-card';
import { TeamFormComponent } from '../components/team-form/team-form';
import { TeamDetailsComponent } from '../components/team-details/team-details';
import { MembersManagement } from '../components/members-management/members-management';
import { TeamsService } from '../services/teams.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Team, CreateTeamDto, UpdateTeamDto } from '../models/team.model';
import { TeamMember } from '../models/team.model';

type ViewMode = 'list' | 'create' | 'edit' | 'details';
type TabMode = 'teams' | 'members';

@Component({
  selector: 'app-teams-page',
  standalone: true,
  imports: [
    CommonModule,
    Sidebar,
    Navbar,
    TeamCard,
    TeamFormComponent,
    TeamDetailsComponent,
    MembersManagement,
  ],
  templateUrl: './teams-page.html',
  styleUrls: ['./teams-page.css'],
})
export class TeamsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  private teamsService = inject(TeamsService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;
  currentProjectId = this.projectContextService.currentProjectId;

  // Tab state
  activeTab = signal<TabMode>('teams');

  // View state
  viewMode = signal<ViewMode>('list');
  searchQuery = signal('');
  filterStatus = signal<'all' | 'Active' | 'Inactive'>('all');
  selectedTeamForEdit = signal<Team | null>(null);

  // Data from service
  teams = this.teamsService.teams;
  selectedTeam = this.teamsService.selectedTeam;
  teamCount = this.teamsService.teamCount;

  // Computed values
  filteredTeams = computed(() => {
    let filtered = this.teams();
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(t => t.status === status);
    }

    // Filter by search query
    if (query) {
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.projectName?.toLowerCase().includes(query) ||
          t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  });

  availableMembers = signal<TeamMember[]>([]);

  ngOnInit(): void {
    // Always get project ID from sessionStorage first (only in browser)
    let projectId: string | null = null;
    
    if (this.isBrowser) {
      projectId = sessionStorage.getItem('projectId');
      console.log('Teams Page - Project ID from sessionStorage:', projectId);
    }
    
    // Fallback to route params if not in sessionStorage
    if (!projectId) {
      projectId = this.route.parent?.snapshot.paramMap.get('projectId') || null;
      console.log('Teams Page - Fallback to route params:', projectId);
    }
    
    console.log('Teams Page - Final Project ID:', projectId);
    
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
      
      // Fetch team count from API
      this.teamsService.getTeamCount(projectId).subscribe({
        next: (teamCountData) => {
          console.log('Teams Page - Loaded team count from API:', teamCountData);
        },
        error: (error) => {
          console.error('Teams Page - Error loading team count from API:', error);
        }
      });

      // Fetch teams from API
      this.teamsService.getTeamsByProjectId(projectId).subscribe({
        next: (teams) => {
          console.log('Teams Page - Loaded teams from API:', teams);
        },
        error: (error) => {
          console.error('Teams Page - Error loading teams from API:', error);
        }
      });
    }
      // Fetch project members from API for team lead/member selection
  this.teamsService.getProjectMembersFromApi(projectId as string).subscribe({
        next: (members) => {
          this.availableMembers.set(members);
        },
        error: (error) => {
          console.error('Teams Page - Error loading project members from API:', error);
        }
      });
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  // Tab handlers
  switchTab(tab: TabMode): void {
    this.activeTab.set(tab);
    // Reset view mode when switching tabs
    this.viewMode.set('list');
  }

  // View mode handlers
  showCreateForm(): void {
    this.viewMode.set('create');
    this.selectedTeamForEdit.set(null);
  }

  showEditForm(teamId: string): void {
    const team = this.teamsService.getTeamById(teamId);
    if (team) {
      this.selectedTeamForEdit.set(team);
      this.viewMode.set('edit');
      
      // Store teamId in session storage
      if (this.isBrowser) {
        sessionStorage.setItem('teamId', teamId);
        console.log('Teams Page - Stored teamId in session:', teamId);
      }
    }
  }

  showDetails(teamId: string): void {
    this.teamsService.selectTeam(teamId);
    this.viewMode.set('details');
    
    // Store teamId in session storage
    if (this.isBrowser) {
      sessionStorage.setItem('teamId', teamId);
      console.log('Teams Page - Stored teamId in session:', teamId);
    }
  }

  showList(): void {
    this.viewMode.set('list');
    this.selectedTeamForEdit.set(null);
    this.teamsService.selectTeam(null);
  }

  // Form handlers
  handleCreateTeam(dto: CreateTeamDto | UpdateTeamDto): void {
    if (this.viewMode() === 'create') {
      const createDto = (dto as any).dto ? (dto as any).dto : dto;
      console.log('TeamsPage - handleCreateTeam called with DTO:', createDto);
      console.log('TeamsPage - Available members:', this.availableMembers());
      this.teamsService.createTeam(createDto as CreateTeamDto, this.availableMembers()).subscribe({
        next: (response) => {
          console.log('Team created successfully:', response);
          // Refresh teams list
          const projectId = this.currentProjectId();
          if (projectId) {
            this.teamsService.getTeamsByProjectId(projectId).subscribe();
          }
          this.showList();
        },
        error: (error) => {
          console.error('Error creating team:', error);
          console.error('Error details:', error.error);
          console.error('Validation errors:', error.error?.errors);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          alert('Failed to create team. Please check the console for validation errors.');
        }
      });
    }
  }

  handleUpdateTeam(dto: CreateTeamDto | UpdateTeamDto): void {
    if (this.viewMode() === 'edit' && this.selectedTeamForEdit()) {
      this.teamsService.updateTeam(this.selectedTeamForEdit()!.id, dto as UpdateTeamDto).subscribe({
        next: (response) => {
          console.log('Team updated successfully:', response);
          // Refresh teams list
          const projectId = this.currentProjectId();
          if (projectId) {
            this.teamsService.getTeamsByProjectId(projectId).subscribe();
          }
          this.showList();
        },
        error: (error) => {
          console.error('Error updating team:', error);
          alert('Failed to update team. Please check the console for details.');
        }
      });
    }
  }

  handleDeleteTeam(teamId: string): void {
    if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      this.teamsService.deleteTeam(teamId);
    }
  }

  // Detail handlers
  handleDetailsClose(): void {
    this.showList();
  }

  handleDetailsEdit(teamId: string): void {
    this.showEditForm(teamId);
  }

  // Filter handlers
  setFilterStatus(status: 'all' | 'Active' | 'Inactive'): void {
    this.filterStatus.set(status);
  }

  updateSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  // Get team stats for details view
  getTeamStats(teamId: string) {
    return this.teamsService.getTeamStats(teamId);
  }
}
