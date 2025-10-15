import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-input.html',
  styleUrls: ['./message-input.css'],
})
export class MessageInput {
  channelName = input<string>('');

  messageSent = output<string>();

  messageText = signal<string>('');

  onSendMessage(): void {
    const text = this.messageText().trim();
    if (!text) return;

    this.messageSent.emit(text);
    this.messageText.set('');
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }
}
