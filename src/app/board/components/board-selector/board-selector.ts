import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { Board } from '../../models/board.model';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { ProjectContextService } from '../../../shared/services/project-context.service';
import { TeamApiService, Team } from '../../services/team-api.service';
import { UserContextService } from '../../../shared/services/user-context.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-board-selector',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './board-selector.html',
  styleUrls: ['./board-selector.css']
})
export class BoardSelector {
  private boardService = inject(BoardService);
  private projectContextService = inject(ProjectContextService);
  private teamApiService = inject(TeamApiService);
  private userContextService = inject(UserContextService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  isOpen = signal(false);
  currentBoard = this.boardService.currentBoard;
  
  // Store teams for current project
  private projectTeamsSignal = signal<Team[]>([]);
  
  // Load teams when project changes
  private loadTeamsEffect = effect(async () => {
    const projectId = this.projectContextService.currentProjectId();
    if (projectId) {
      try {
        const teams = await firstValueFrom(this.teamApiService.getTeamsByProject(projectId));
        this.projectTeamsSignal.set(teams);
      } catch (error) {
        console.error('[BoardSelector] Error loading teams:', error);
        this.projectTeamsSignal.set([]);
      }
    } else {
      this.projectTeamsSignal.set([]);
    }
  });
  
  // Use computed signal to sort boards with priority logic:
  // 1. If user IS in a team → show that team's board first
  // 2. If user IS NOT in a team → show default board (isDefault=true) first
  projectBoards = computed(() => {
    const projectId = this.projectContextService.currentProjectId();
    if (!projectId) return [];
    
    const boards = this.boardService.getBoardsByProject(projectId);
    const teams = this.projectTeamsSignal();
    const userEmail = this.userContextService.getCurrentUserEmail();
    
    if (!userEmail) {
      // No user - prioritize default board
      return [...boards].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return 0;
      });
    }
    
    // Find teams where current user is a member or lead
    const userTeamNames = new Set<string>();
    for (const team of teams) {
      const isMember = team.members.some(m => m.email === userEmail);
      const isLead = team.lead.email === userEmail;
      
      if (isMember || isLead) {
        userTeamNames.add(team.name);
      }
    }
    
    const userIsInAnyTeam = userTeamNames.size > 0;
    
    // Sort boards based on user team membership
    return [...boards].sort((a, b) => {
      const aIsUserTeamBoard = a.source === 'TEAM' && a.teamName && userTeamNames.has(a.teamName);
      const bIsUserTeamBoard = b.source === 'TEAM' && b.teamName && userTeamNames.has(b.teamName);
      
      if (userIsInAnyTeam) {
        // User is in a team → prioritize their team boards
        if (aIsUserTeamBoard && !bIsUserTeamBoard) return -1;
        if (!aIsUserTeamBoard && bIsUserTeamBoard) return 1;
      } else {
        // User is NOT in any team (e.g., project manager) → prioritize default board
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
      }
      
      // Within same priority, maintain original order
      return 0;
    });
  });
  
  get currentBoardName(): string {
    const board = this.currentBoard();
    return board ? board.name : 'Select Board';
  }
  
  toggleDropdown(): void {
    this.isOpen.set(!this.isOpen());
  }
  
  selectBoard(board: Board): void {
    this.boardService.setCurrentBoard(board.id);
    
    // Navigate with query params to trigger board reload
    const projectId = this.projectContextService.currentProjectId();
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'board'], {
        queryParams: { boardId: board.id }
      });
    }
    
    this.isOpen.set(false);
  }
  
  closeDropdown(): void {
    this.isOpen.set(false);
  }
  
  isSelected(board: Board): boolean {
    return this.currentBoard()?.id === board.id;
  }
}
