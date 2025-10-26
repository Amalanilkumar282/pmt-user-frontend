import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
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

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  // Team and channel selection
  selectedTeamId = signal<string>('team-1');
  selectedChannelId = signal<string>('channel-1');
  messageText = signal<string>('');
  showTeamDropdown = signal<boolean>(false);

  // Search functionality
  showSearch = signal<boolean>(false);
  searchQuery = signal<string>('');

  // Available teams with channels
  teams = signal<Team[]>([
    {
      id: 'team-1',
      name: 'Backend Development Team',
      icon: 'BD',
      channels: [
        {
          id: 'channel-1',
          name: 'announcements',
          type: 'channel',
          unreadCount: 0,
          isPrivate: false,
        },
        {
          id: 'channel-2',
          name: 'project-gizmo',
          type: 'channel',
          unreadCount: 3,
          isPrivate: false,
        },
        {
          id: 'channel-3',
          name: 'team-marketing',
          type: 'channel',
          unreadCount: 0,
          isPrivate: false,
        },
        { id: 'channel-4', name: 'random', type: 'channel', unreadCount: 0, isPrivate: false },
        { id: 'channel-5', name: 'engineering', type: 'channel', unreadCount: 0, isPrivate: true },
      ],
    },
    {
      id: 'team-2',
      name: 'Frontend Development Team',
      icon: 'FD',
      channels: [
        { id: 'channel-6', name: 'general', type: 'channel', unreadCount: 2, isPrivate: false },
        { id: 'channel-7', name: 'dev-team', type: 'channel', unreadCount: 5, isPrivate: false },
      ],
    },
    {
      id: 'team-3',
      name: 'Mobile Development Team',
      icon: 'MD',
      channels: [
        {
          id: 'channel-8',
          name: 'design-feedback',
          type: 'channel',
          unreadCount: 0,
          isPrivate: false,
        },
        { id: 'channel-9', name: 'clients', type: 'channel', unreadCount: 1, isPrivate: true },
      ],
    },
  ]);

  // Messages for each channel
  private allMessages = signal<Record<string, Message[]>>({
    'channel-2': [
      {
        id: 'm1',
        user: 'Sarah Johnson',
        userAvatar: 'SJ',
        text: 'Hey team! Just finished the wireframes for the new dashboard. Would love to get your feedback.',
        timestamp: new Date('2025-10-15T09:30:00'),
      },
      {
        id: 'm2',
        user: 'Mike Chen',
        userAvatar: 'MC',
        text: 'Great work Sarah! The layout looks much cleaner than the previous version.',
        timestamp: new Date('2025-10-15T09:45:00'),
      },
      {
        id: 'm3',
        user: 'Alex Rivera',
        userAvatar: 'AR',
        text: '@Sarah the color scheme is perfect. When can we start implementing this?',
        timestamp: new Date('2025-10-15T10:15:00'),
      },
      {
        id: 'm4',
        user: 'Emma Watson',
        userAvatar: 'EW',
        text: 'Quick reminder: We have the Project Status Meeting today from 01:30-02:00 IST',
        timestamp: new Date('2025-10-15T11:00:00'),
      },
    ],
    'channel-1': [
      {
        id: 'm5',
        user: 'Admin',
        userAvatar: 'AD',
        text: '📢 Welcome to the announcements channel! Important updates will be posted here.',
        timestamp: new Date('2025-10-14T09:00:00'),
      },
    ],
    'channel-3': [
      {
        id: 'm6',
        user: 'Lisa Park',
        userAvatar: 'LP',
        text: 'Marketing campaign for Q4 is ready for review. Check the shared drive!',
        timestamp: new Date('2025-10-15T08:00:00'),
      },
      {
        id: 'm7',
        user: 'Tom Williams',
        userAvatar: 'TW',
        text: "Looks great! Let's schedule a meeting to discuss the rollout plan.",
        timestamp: new Date('2025-10-13T08:30:00'),
      },
    ],
    'channel-5': [
      {
        id: 'm8',
        user: 'John Davis',
        userAvatar: 'JD',
        text: 'Code review needed for PR #234. It includes the new authentication module.',
        timestamp: new Date('2025-10-15T07:15:00'),
      },
    ],
  });

  // Computed messages for selected channel (with search filtering)
  messages = computed(() => {
    const channelId = this.selectedChannelId();
    const allChannelMessages = this.allMessages()[channelId] || [];

    // If search is active and has a query, filter messages
    if (this.showSearch() && this.searchQuery().trim()) {
      const query = this.searchQuery().toLowerCase().trim();
      return allChannelMessages.filter(
        (msg) => msg.text.toLowerCase().includes(query) || msg.user.toLowerCase().includes(query)
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
    }
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  selectTeam(teamId: string): void {
    this.selectedTeamId.set(teamId);
    this.showTeamDropdown.set(false);
    // Select first channel of the new team
    const team = this.teams().find((t) => t.id === teamId);
    if (team && team.channels.length > 0) {
      this.selectedChannelId.set(team.channels[0].id);
    }
  }

  selectChannel(channelId: string): void {
    this.selectedChannelId.set(channelId);
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

    const newMessage: Message = {
      id: 'm' + Date.now(),
      user: 'You',
      userAvatar: 'YO',
      text: text,
      timestamp: new Date(),
    };

    const channelId = this.selectedChannelId();
    this.allMessages.update((messages) => ({
      ...messages,
      [channelId]: [...(messages[channelId] || []), newMessage],
    }));

    this.messageText.set('');
  }

  onMessageSent(text: string): void {
    this.messageText.set(text);
    this.sendMessage();
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
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

  addChannel(channelName: string): void {
    const teamId = this.selectedTeamId();
    const newChannelId = 'channel-' + Date.now();

    // Add the new channel to the selected team
    this.teams.update((teams) =>
      teams.map((team) => {
        if (team.id !== teamId) return team;
        return {
          ...team,
          channels: [
            ...team.channels,
            {
              id: newChannelId,
              name: channelName,
              type: 'channel' as const,
              unreadCount: 0,
              isPrivate: false,
            },
          ],
        };
      })
    );

    // Initialize empty messages array for the new channel
    this.allMessages.update((messages) => ({
      ...messages,
      [newChannelId]: [],
    }));

    // Select the newly created channel
    this.selectedChannelId.set(newChannelId);
  }
}
