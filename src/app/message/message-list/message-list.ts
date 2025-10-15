import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Message {
  id: string;
  user: string;
  userAvatar: string;
  text: string;
  timestamp: Date;
  reactions?: { emoji: string; count: number; users: string[] }[];
  threadCount?: number;
}

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-list.html',
  styleUrls: ['./message-list.css'],
})
export class MessageList {
  messages = input.required<Message[]>();
  channelName = input<string>('');

  reactionAdded = output<{ messageId: string; emoji: string }>();

  onAddReaction(messageId: string, emoji: string): void {
    this.reactionAdded.emit({ messageId, emoji });
  }

  formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}
