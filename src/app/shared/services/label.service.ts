import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthTokenService } from '../../board/services/auth-token.service';

export interface Label {
  id: number;
  name: string;
  colour: string;
}

export interface LabelResponse {
  status: number;
  data: Label[];
  message: string;
}

export interface CreateLabelRequest {
  name: string;
  colour: string;
}

export interface UpdateLabelRequest {
  id: number;
  name: string;
  colour: string;
}

export interface CreateLabelResponse {
  status: number;
  data: Label;
  message: string;
}

export interface UpdateLabelResponse {
  status: number;
  data: Label;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class LabelService {
  private baseUrl = '/api/Label';
  private http = inject(HttpClient);
  private authTokenService = inject(AuthTokenService);
  getAllLabels(): Observable<LabelResponse> {
    return this.http.get<LabelResponse>(this.baseUrl, {
      headers: this.authTokenService.getAuthHeaders()
    });
  }

  createLabel(request: CreateLabelRequest): Observable<CreateLabelResponse> {
    let token = '';
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || '';
    }
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post<CreateLabelResponse>(this.baseUrl, request, { headers });
  }

  updateLabel(request: UpdateLabelRequest): Observable<UpdateLabelResponse> {
    const token = sessionStorage.getItem('accessToken') || '';
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.put<UpdateLabelResponse>(this.baseUrl, request, { headers });
  }
}
