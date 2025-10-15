import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  selector: 'app-channel-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-list.html',
  styleUrls: ['./channel-list.css'],
})
export class ChannelList {
  teams = input.required<Team[]>();
  selectedTeamId = input.required<string>();
  selectedChannelId = input.required<string>();
  showTeamDropdown = input.required<boolean>();

  teamSelected = output<string>();
  channelSelected = output<string>();
  toggleDropdown = output<void>();
  closeDropdown = output<void>();

  get selectedTeam(): Team | undefined {
    return this.teams().find((t) => t.id === this.selectedTeamId());
  }

  get channels(): Channel[] {
    return this.selectedTeam?.channels || [];
  }

  get selectedChannel(): Channel | undefined {
    return this.channels.find((c) => c.id === this.selectedChannelId());
  }

  onSelectTeam(teamId: string): void {
    this.teamSelected.emit(teamId);
  }

  onSelectChannel(channelId: string): void {
    this.channelSelected.emit(channelId);
  }

  onToggleDropdown(): void {
    this.toggleDropdown.emit();
  }

  onCloseDropdown(): void {
    this.closeDropdown.emit();
  }
}
