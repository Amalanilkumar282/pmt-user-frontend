import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
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
  private baseUrl = `${environment.apiUrl}/api/Label`;
  private http = inject(HttpClient);

  getAllLabels(): Observable<LabelResponse> {
    // Interceptor automatically adds Authorization header
    return this.http.get<LabelResponse>(this.baseUrl);
  }

  createLabel(request: CreateLabelRequest): Observable<CreateLabelResponse> {
    // Interceptor automatically adds Authorization header
    return this.http.post<CreateLabelResponse>(this.baseUrl, request);
  }

  updateLabel(request: UpdateLabelRequest): Observable<UpdateLabelResponse> {
    // Interceptor automatically adds Authorization header
    return this.http.put<UpdateLabelResponse>(this.baseUrl, request);
  }
}
