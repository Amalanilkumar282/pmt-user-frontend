import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-list.html',
  styleUrls: ['./channel-list.css'],
})
export class ChannelList {
  teams = input.required<Team[]>();
  selectedTeamId = input.required<string | null>();
  selectedChannelId = input.required<string | null>();
  showTeamDropdown = input.required<boolean>();

  teamSelected = output<string>();
  channelSelected = output<string>();
  toggleDropdown = output<void>();
  closeDropdown = output<void>();
  addChannel = output<string>();

  showAddChannelInput = signal<boolean>(false);
  newChannelName = '';

  get selectedTeam(): Team | undefined {
    const teamId = this.selectedTeamId();
    return teamId ? this.teams().find((t) => t.id === teamId) : undefined;
  }

  get channels(): Channel[] {
    return this.selectedTeam?.channels || [];
  }

  get selectedChannel(): Channel | undefined {
    const channelId = this.selectedChannelId();
    return channelId ? this.channels.find((c) => c.id === channelId) : undefined;
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

  onAddChannel(): void {
    this.showAddChannelInput.set(true);
    this.newChannelName = '';
  }

  onSaveChannel(): void {
    const channelName = this.newChannelName.trim();
    if (channelName) {
      this.addChannel.emit(channelName);
      this.showAddChannelInput.set(false);
      this.newChannelName = '';
    }
  }

  onCancelAddChannel(): void {
    this.showAddChannelInput.set(false);
    this.newChannelName = '';
  }
}
