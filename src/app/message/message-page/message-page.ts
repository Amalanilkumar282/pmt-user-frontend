import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { TeamsService } from '../../teams/services/teams.service';
import { ChannelService } from '../services/channel.service';
import { ChannelList } from '../channel-list/channel-list';
import { MessageList } from '../message-list/message-list';
import { MessageInput } from '../message-input/message-input';

interface Message {
  id: string;
  user: string;
  userAvatar: string;
  text: string;
  timestamp: Date;
}

interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  unreadCount: number;
  isPrivate: boolean;
}

interface Team {
  id: string;
  name: string;
  icon: string;
  channels: Channel[];
}

@Component({
  selector: 'app-message-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Navbar, ChannelList, MessageList, MessageInput],
  templateUrl: './message-page.html',
  styleUrls: ['./message-page.css'],
})
export class MessagePage implements OnInit {
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  private teamsService = inject(TeamsService);
  private channelService = inject(ChannelService);

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  // Team and channel selection
  selectedTeamId = signal<string | null>(null);
  selectedChannelId = signal<string | null>(null);
  messageText = signal<string>('');
  showTeamDropdown = signal<boolean>(false);

  // Search functionality
  showSearch = signal<boolean>(false);
  searchQuery = signal<string>('');

  // More menu dropdown
  showMoreMenu = signal<boolean>(false);

  // Loading state
  isLoadingTeams = signal<boolean>(false);
  isLoadingMessages = signal<boolean>(false);

  // Available teams with channels (loaded from API)
  teams = signal<Team[]>([]);

  // Messages for each channel (will be loaded from API later)
  private allMessages = signal<Record<string, Message[]>>({});

  // Computed messages for selected channel (with search filtering)
  messages = computed(() => {
    const channelId = this.selectedChannelId();
    if (!channelId) return [];

    const allChannelMessages = this.allMessages()[channelId] || [];

    // If search is active and has a query, filter messages
    if (this.showSearch() && this.searchQuery().trim()) {
      const query = this.searchQuery().toLowerCase().trim();
      return allChannelMessages.filter(
        (msg: Message) =>
          msg.text.toLowerCase().includes(query) || msg.user.toLowerCase().includes(query)
      );
    }

    return allChannelMessages;
  });

  // Computed selected team info
  selectedTeam = computed(() => {
    return this.teams().find((t) => t.id === this.selectedTeamId());
  });

  // Computed channels for selected team
  channels = computed(() => {
    return this.selectedTeam()?.channels || [];
  });

  // Computed selected channel info
  selectedChannel = computed(() => {
    return this.channels().find((c) => c.id === this.selectedChannelId());
  });

  ngOnInit(): void {
    // Set project context from route params
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
      this.loadTeams(projectId);
    }
  }

  /**
   * Load teams from API for the current project
   */
  private loadTeams(projectId: string): void {
    this.isLoadingTeams.set(true);

    this.teamsService.getTeamsByProjectId(projectId).subscribe({
      next: (apiTeams) => {
        console.log('Loaded teams from API:', apiTeams);

        // Transform API teams to message page team format
        const messageTeams: Team[] = apiTeams.map((team) => ({
          id: team.id,
          name: team.name,
          icon: this.getTeamInitials(team.name),
          channels: [], // Channels will be loaded when team is selected
        }));

        this.teams.set(messageTeams);

        // Auto-select first team and load its channels
        if (messageTeams.length > 0) {
          this.selectedTeamId.set(messageTeams[0].id);
          this.loadChannelsForTeam(messageTeams[0].id);
        }

        this.isLoadingTeams.set(false);
      },
      error: (error) => {
        console.error('Error loading teams:', error);
        this.isLoadingTeams.set(false);
        // Don't fallback to dummy data - keep empty
      },
    });
  }

  /**
   * Load channels for a specific team
   */
  private loadChannelsForTeam(teamId: string): void {
    console.log('Loading channels for team:', teamId);

    this.channelService.getChannelsByTeamId(teamId).subscribe({
      next: (channels) => {
        console.log('Loaded channels:', channels);

        // Update the team's channels
        this.teams.update((teams) =>
          teams.map((team) => {
            if (team.id === teamId) {
              return { ...team, channels };
            }
            return team;
          })
        );

        // Auto-select first channel if available
        if (channels.length > 0) {
          this.selectedChannelId.set(channels[0].id);
          this.loadMessagesForChannel(channels[0].id);
        } else {
          this.selectedChannelId.set(null);
        }
      },
      error: (error) => {
        console.error('Error loading channels for team:', teamId, error);
      },
    });
  }

  /**
   * Load messages for a specific channel
   */
  private loadMessagesForChannel(channelId: string): void {
    console.log('Loading messages for channel:', channelId);
    this.isLoadingMessages.set(true);

    this.channelService.getMessagesByChannelId(channelId).subscribe({
      next: (messages) => {
        console.log('Loaded messages:', messages);

        // Update messages for this channel
        this.allMessages.update((allMsgs) => ({
          ...allMsgs,
          [channelId]: messages,
        }));

        this.isLoadingMessages.set(false);
      },
      error: (error) => {
        console.error('Error loading messages for channel:', channelId, error);
        this.isLoadingMessages.set(false);
      },
    });
  }

  /**
   * Get team initials from team name
   */
  private getTeamInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  selectTeam(teamId: string): void {
    this.selectedTeamId.set(teamId);
    this.showTeamDropdown.set(false);

    // Check if team already has channels loaded
    const team = this.teams().find((t) => t.id === teamId);
    if (team && team.channels.length > 0) {
      // Channels already loaded, select first one and load its messages
      this.selectedChannelId.set(team.channels[0].id);
      this.loadMessagesForChannel(team.channels[0].id);
    } else {
      // Load channels for this team
      this.loadChannelsForTeam(teamId);
    }
  }

  selectChannel(channelId: string): void {
    this.selectedChannelId.set(channelId);

    // Load messages for this channel if not already loaded
    const channelMessages = this.allMessages()[channelId];
    if (!channelMessages) {
      this.loadMessagesForChannel(channelId);
    }

    // Mark channel as read
    const teamId = this.selectedTeamId();
    this.teams.update((teams) =>
      teams.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          channels: t.channels.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c)),
        };
      })
    );
  }

  toggleTeamDropdown(): void {
    this.showTeamDropdown.update((v) => !v);
  }

  closeTeamDropdown(): void {
    this.showTeamDropdown.set(false);
  }

  sendMessage(): void {
    const text = this.messageText().trim();
    if (!text) return;

    const channelId = this.selectedChannelId();
    if (!channelId) return;

    // Get current user ID from session storage
    const userIdStr = sessionStorage.getItem('userId');
    if (!userIdStr) {
      console.error('User ID not found in session storage');
      return;
    }
    const userId = parseInt(userIdStr);

    // Call API to create message
    this.channelService.createMessage(channelId, text, userId).subscribe({
      next: (newMessage) => {
        console.log('Message created:', newMessage);

        // Add the new message to the channel's messages
        this.allMessages.update((messages) => ({
          ...messages,
          [channelId]: [...(messages[channelId] || []), newMessage],
        }));

        this.messageText.set('');
      },
      error: (error) => {
        console.error('Error creating message:', error);
        // You can add toast notification here
      },
    });
  }

  onMessageSent(text: string): void {
    this.messageText.set(text);
    this.sendMessage();
  }

  // Search functionality
  toggleSearch(): void {
    this.showSearch.update((v) => !v);
    if (!this.showSearch()) {
      this.searchQuery.set('');
    }
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  // More menu functionality
  toggleMoreMenu(): void {
    this.showMoreMenu.update((v) => !v);
  }

  closeMoreMenu(): void {
    this.showMoreMenu.set(false);
  }

  deleteChannel(): void {
    const channelId = this.selectedChannelId();
    const teamId = this.selectedTeamId();

    if (!channelId || !teamId) return;

    // Get current user ID from session storage
    const userIdStr = sessionStorage.getItem('userId');
    const userId = userIdStr ? parseInt(userIdStr) : undefined;

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete this channel? This action cannot be undone.`)) {
      return;
    }

    // Close the more menu
    this.closeMoreMenu();

    // Call API to delete channel
    this.channelService.deleteChannel(channelId, userId).subscribe({
      next: (success) => {
        console.log('Channel deleted:', success);

        if (success) {
          // Remove the channel from the team's channels
          this.teams.update((teams) =>
            teams.map((team) => {
              if (team.id === teamId) {
                const updatedChannels = team.channels.filter((c) => c.id !== channelId);
                return { ...team, channels: updatedChannels };
              }
              return team;
            })
          );

          // Remove messages for this channel
          this.allMessages.update((messages) => {
            const { [channelId]: deleted, ...rest } = messages;
            return rest;
          });

          // Select first available channel or null
          const currentTeam = this.teams().find((t) => t.id === teamId);
          if (currentTeam && currentTeam.channels.length > 0) {
            this.selectedChannelId.set(currentTeam.channels[0].id);
            this.loadMessagesForChannel(currentTeam.channels[0].id);
          } else {
            this.selectedChannelId.set(null);
          }
        }
      },
      error: (error) => {
        console.error('Error deleting channel:', error);
        alert('Failed to delete channel. Please try again.');
      },
    });
  }

  addChannel(channelName: string): void {
    const teamId = this.selectedTeamId();
    if (!teamId) return;

    // Call API to create channel
    this.channelService.createChannel(parseInt(teamId), channelName).subscribe({
      next: (newChannel) => {
        console.log('Channel created:', newChannel);

        // Add the new channel to the selected team
        this.teams.update((teams) =>
          teams.map((team) => {
            if (team.id !== teamId) return team;
            return {
              ...team,
              channels: [...team.channels, newChannel],
            };
          })
        );

        // Initialize empty messages array for the new channel
        this.allMessages.update((messages) => ({
          ...messages,
          [newChannel.id]: [],
        }));

        // Select the newly created channel
        this.selectedChannelId.set(newChannel.id);
      },
      error: (error) => {
        console.error('Error creating channel:', error);
        // You can add toast notification here
      },
    });
  }
}
