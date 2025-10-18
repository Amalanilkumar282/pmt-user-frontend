import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
  searchQuery = input<string>('');

  reactionAdded = output<{ messageId: string; emoji: string }>();

  constructor(private sanitizer: DomSanitizer) {}

  onAddReaction(messageId: string, emoji: string): void {
    this.reactionAdded.emit({ messageId, emoji });
  }

  formatTimestamp(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    const isToday = now.toDateString() === messageDate.toDateString();
    const isYesterday =
      new Date(now.setDate(now.getDate() - 1)).toDateString() === messageDate.toDateString();

    const time = messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today at ${time}`;
    } else if (isYesterday) {
      return `Yesterday at ${time}`;
    } else {
      // Show full date for older messages
      const dateStr = messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
      return `${dateStr} at ${time}`;
    }
  }

  formatFullDateTime(date: Date): string {
    // For tooltip/hover - show complete date and time
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  renderMarkdown(text: string): SafeHtml {
    // Escape HTML to prevent XSS
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Convert Markdown to HTML
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_ (but not __ which is handled above)
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>');

    // Links: [text](url)
    html = html.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>'
    );

    // Preserve line breaks
    html = html.replace(/\n/g, '<br>');

    // Highlight search term if present
    const query = this.searchQuery().trim();
    if (query) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      html = html.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    return this.sanitizer.sanitize(1, html) || '';
  }
}
