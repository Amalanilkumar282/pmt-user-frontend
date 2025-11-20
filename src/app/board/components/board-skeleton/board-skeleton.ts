import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-board-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex gap-4 h-full overflow-x-auto overflow-y-hidden">
      <!-- Generate 4 skeleton columns -->
      <div *ngFor="let col of [1, 2, 3, 4]" class="flex-shrink-0 w-75">
        <div class="board-column-skeleton">
          <!-- Column header skeleton -->
          <div class="skeleton-header">
            <div class="skeleton-title"></div>
            <div class="skeleton-count"></div>
          </div>
          
          <!-- Card skeletons -->
          <div class="skeleton-cards">
            <div *ngFor="let card of [1, 2, 3]" class="skeleton-card">
              <div class="skeleton-card-header">
                <div class="skeleton-card-key"></div>
                <div class="skeleton-card-priority"></div>
              </div>
              <div class="skeleton-card-title"></div>
              <div class="skeleton-card-footer">
                <div class="skeleton-card-avatar"></div>
                <div class="skeleton-card-date"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .board-column-skeleton {
      background: #ffffff;
      border-radius: 8px;
      padding: 16px;
      height: 100%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .skeleton-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
    }

    .skeleton-title {
      width: 120px;
      height: 20px;
      background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
      background-size: 200% 100%;
      border-radius: 4px;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-count {
      width: 32px;
      height: 24px;
      background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
      background-size: 200% 100%;
      border-radius: 12px;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .skeleton-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .skeleton-card-key {
      width: 60px;
      height: 14px;
      background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%);
      background-size: 200% 100%;
      border-radius: 3px;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-card-priority {
      width: 20px;
      height: 20px;
      background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%);
      background-size: 200% 100%;
      border-radius: 3px;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-card-title {
      width: 100%;
      height: 16px;
      background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%);
      background-size: 200% 100%;
      border-radius: 3px;
      margin-bottom: 12px;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .skeleton-card-avatar {
      width: 24px;
      height: 24px;
      background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%);
      background-size: 200% 100%;
      border-radius: 50%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-card-date {
      width: 80px;
      height: 12px;
      background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%);
      background-size: 200% 100%;
      border-radius: 3px;
      animation: shimmer 1.5s infinite;
    }

    /* Shimmer animation - moving gradient */
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    /* Pulse animation - subtle opacity change */
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
    }

    /* Width class matching board column */
    .w-75 {
      width: 320px;
      min-width: 320px;
    }
  `]
})
export class BoardSkeleton {}
