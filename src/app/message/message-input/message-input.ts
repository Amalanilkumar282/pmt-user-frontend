import { Component, input, output, signal, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('messageTextarea') messageTextarea?: ElementRef<HTMLTextAreaElement>;

  channelName = input<string>('');

  messageSent = output<string>();

  messageText = signal<string>('');
  showEmojiPicker = signal<boolean>(false);

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

  applyFormatting(type: 'bold' | 'italic' | 'link'): void {
    const textarea = this.messageTextarea?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    let result = '';
    let caretPos = 0;

    if (type === 'bold') {
      if (selected) {
        result = `${before}**${selected}**${after}`;
        caretPos = start + selected.length + 4;
      } else {
        result = `${before}****${after}`;
        caretPos = start + 2;
      }
    } else if (type === 'italic') {
      if (selected) {
        result = `${before}_${selected}_${after}`;
        caretPos = start + selected.length + 2;
      } else {
        result = `${before}__${after}`;
        caretPos = start + 1;
      }
    } else if (type === 'link') {
      if (selected) {
        result = `${before}[${selected}](url)${after}`;
        caretPos = start + selected.length + 3; // place inside url
      } else {
        result = `${before}[text](url)${after}`;
        caretPos = start + 1; // inside text
      }
    }

    this.messageText.set(result);

    // adjust cursor after DOM update
    setTimeout(() => {
      const ta = this.messageTextarea?.nativeElement;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(caretPos, caretPos);
      }
    }, 0);
  }

  insertEmoji(): void {
    // legacy random insert kept for backward compatibility; prefer chooseEmoji
    this.chooseEmoji('�');
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker.update((v) => !v);
  }

  chooseEmoji(emoji: string): void {
    const textarea = this.messageTextarea?.nativeElement;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const value = textarea.value;
    const before = value.substring(0, pos);
    const after = value.substring(pos);

    const newVal = `${before}${emoji}${after}`;
    this.messageText.set(newVal);
    this.showEmojiPicker.set(false);

    setTimeout(() => {
      const ta = this.messageTextarea?.nativeElement;
      if (ta) {
        const newPos = pos + emoji.length;
        ta.focus();
        ta.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }
}
