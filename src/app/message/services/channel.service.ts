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

export interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  unreadCount: number;
  isPrivate: boolean;
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
}
