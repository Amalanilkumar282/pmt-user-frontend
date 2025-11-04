import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UploadFileResponse {
	status: number;
	data: string; // URL of the uploaded file
	message: string;
}

@Injectable({ providedIn: 'root' })
export class AttachmentService {
	private baseUrl = '/api/File/upload';

	constructor(private http: HttpClient) {}

	uploadFile(file: File, bucketName: string = 'attachments'): Observable<UploadFileResponse> {
		const token = sessionStorage.getItem('accessToken') || '';
		
		const formData = new FormData();
		formData.append('file', file);
		formData.append('bucket', bucketName);

		const headers = { 'Authorization': `Bearer ${token}` };
		
		return this.http.post<UploadFileResponse>(this.baseUrl, formData, { headers });
	}

	uploadMultipleFiles(files: File[], bucketName: string = 'attachments'): Observable<UploadFileResponse[]> {
		const uploadObservables = files.map(file => this.uploadFile(file, bucketName));
		// Note: This returns an array of observables. You may want to use forkJoin to wait for all uploads
		return new Observable(observer => {
			const results: UploadFileResponse[] = [];
			let completed = 0;

			uploadObservables.forEach((obs, index) => {
				obs.subscribe({
					next: (response) => {
						results[index] = response;
						completed++;
						if (completed === uploadObservables.length) {
							observer.next(results);
							observer.complete();
						}
					},
					error: (error) => {
						observer.error(error);
					}
				});
			});
		});
	}
}
