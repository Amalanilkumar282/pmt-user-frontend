import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ChannelDto {
  id: string;
  name: string;
}

export interface ChannelApiResponse {
  status: number;
  data: ChannelDto[];
  message: string;
}

export interface CreateChannelResponse {
  status: number;
  data: ChannelDto;
  message: string;
}

export interface CreateChannelRequest {
  teamId: number;
  channelName: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  unreadCount: number;
  isPrivate: boolean;
}

export interface MessageDto {
  id: string;
  channelId: string;
  body: string;
  mentionUserId: number | null;
  mentionedUserName: string | null;
  createdBy: number;
  creatorName: string;
  updatedBy: number;
  updaterName: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesApiResponse {
  status: number;
  data: MessageDto[];
  message: string;
}

export interface Message {
  id: string;
  user: string;
  userAvatar: string;
  text: string;
  timestamp: Date;
}

export interface CreateMessageRequest {
  channelId: string;
  body: string;
  mentionUserId?: number;
  createdBy: number;
}

export interface CreateMessageResponse {
  status: number;
  data: MessageDto;
  message: string;
}

export interface DeleteChannelResponse {
  status: number;
  data: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private http = inject(HttpClient);
  private readonly API_BASE_URL = 'https://localhost:7117/api';

  /**
   * Get all channels for a specific team
   */
  getChannelsByTeamId(teamId: string): Observable<Channel[]> {
    return this.http.get<ChannelApiResponse>(`${this.API_BASE_URL}/Channel/team/${teamId}`).pipe(
      map((response) => {
        console.log('ChannelService - Raw API response:', response);

        if (response.data && response.data.length > 0) {
          // Transform API response to Channel interface
          const channels: Channel[] = response.data.map((channelDto) => ({
            id: channelDto.id,
            name: channelDto.name,
            type: 'channel' as const,
            unreadCount: 0,
            isPrivate: false,
          }));

          console.log('ChannelService - Mapped channels:', channels);
          return channels;
        }

        return [];
      })
    );
  }

  /**
   * Create a new channel in a team
   */
  createChannel(teamId: number, channelName: string): Observable<Channel> {
    const request: CreateChannelRequest = {
      teamId,
      channelName,
    };

    return this.http.post<CreateChannelResponse>(`${this.API_BASE_URL}/Channel`, request).pipe(
      map((response) => {
        console.log('ChannelService - Create channel response:', response);

        // Transform API response to Channel interface
        const channel: Channel = {
          id: response.data.id,
          name: response.data.name,
          type: 'channel' as const,
          unreadCount: 0,
          isPrivate: false,
        };

        console.log('ChannelService - Created channel:', channel);
        return channel;
      })
    );
  }

  /**
   * Get messages for a specific channel
   */
  getMessagesByChannelId(channelId: string, take: number = 100): Observable<Message[]> {
    return this.http
      .get<MessagesApiResponse>(`${this.API_BASE_URL}/Channel/${channelId}/messages?take=${take}`)
      .pipe(
        map((response) => {
          console.log('ChannelService - Raw messages response:', response);

          if (response.data && response.data.length > 0) {
            // Transform API response to Message interface
            const messages: Message[] = response.data.map((messageDto) => ({
              id: messageDto.id,
              user: messageDto.creatorName,
              userAvatar: this.getInitials(messageDto.creatorName),
              text: messageDto.body,
              timestamp: new Date(messageDto.createdAt),
            }));

            // Reverse to show oldest first (latest at bottom)
            const sortedMessages = messages.reverse();

            console.log('ChannelService - Mapped messages:', sortedMessages);
            return sortedMessages;
          }

          return [];
        })
      );
  }

  /**
   * Get user initials for avatar
   */
  private getInitials(name: string): string {
    if (!name) return 'U';

    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Create a new message in a channel
   */
  createMessage(
    channelId: string,
    body: string,
    createdBy: number,
    mentionUserId?: number
  ): Observable<Message> {
    const request: CreateMessageRequest = {
      channelId,
      body,
      createdBy,
      ...(mentionUserId && { mentionUserId }),
    };

    return this.http.post<CreateMessageResponse>(`${this.API_BASE_URL}/Message`, request).pipe(
      map((response) => {
        console.log('ChannelService - Create message response:', response);

        // Transform API response to Message interface
        const message: Message = {
          id: response.data.id,
          user: response.data.creatorName,
          userAvatar: this.getInitials(response.data.creatorName),
          text: response.data.body,
          timestamp: new Date(response.data.createdAt),
        };

        console.log('ChannelService - Created message:', message);
        return message;
      })
    );
  }

  /**
   * Delete a channel
   */
  deleteChannel(channelId: string, deletedBy?: number): Observable<boolean> {
    const params = deletedBy ? `?deletedBy=${deletedBy}` : '';

    return this.http
      .delete<DeleteChannelResponse>(`${this.API_BASE_URL}/Channel/${channelId}${params}`)
      .pipe(
        map((response) => {
          console.log('ChannelService - Delete channel response:', response);
          return response.data;
        })
      );
  }
}
