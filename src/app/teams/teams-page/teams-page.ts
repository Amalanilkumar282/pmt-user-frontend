import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  activeTeamsCount = computed(() => this.teams().filter(t => t.status === 'Active').length);
  totalMembersCount = computed(() => {
    const uniqueMembers = new Set<string>();
    this.teams().forEach(team => {
      team.members.forEach(member => uniqueMembers.add(member.id));
    });
    return uniqueMembers.size;
  });

  availableMembers = this.teamsService.getAvailableMembers();

  ngOnInit(): void {
    // Set project context from route params if available
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
    }
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
    }
  }

  showDetails(teamId: string): void {
    this.teamsService.selectTeam(teamId);
    this.viewMode.set('details');
  }

  showList(): void {
    this.viewMode.set('list');
    this.selectedTeamForEdit.set(null);
    this.teamsService.selectTeam(null);
  }

  // Form handlers
  handleCreateTeam(dto: CreateTeamDto | UpdateTeamDto): void {
    if (this.viewMode() === 'create') {
      this.teamsService.createTeam(dto as CreateTeamDto);
      this.showList();
    }
  }

  handleUpdateTeam(dto: CreateTeamDto | UpdateTeamDto): void {
    if (this.viewMode() === 'edit' && this.selectedTeamForEdit()) {
      this.teamsService.updateTeam(this.selectedTeamForEdit()!.id, dto as UpdateTeamDto);
      this.showList();
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
