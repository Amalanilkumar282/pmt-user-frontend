import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="'skeleton-wrapper skeleton-' + type">
      <!-- Issue List Skeleton -->
      <ng-container *ngIf="type === 'issue-list'">
        <div *ngFor="let item of items" class="skeleton-issue-item">
          <div class="skeleton-line skeleton-header"></div>
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-meta">
            <div class="skeleton-pill"></div>
            <div class="skeleton-pill"></div>
            <div class="skeleton-pill"></div>
          </div>
        </div>
      </ng-container>

      <!-- Sprint Card Skeleton -->
      <ng-container *ngIf="type === 'sprint-card'">
        <div *ngFor="let item of items" class="skeleton-sprint-card">
          <div class="skeleton-line skeleton-sprint-header"></div>
          <div class="skeleton-line skeleton-sprint-goal"></div>
          <div class="skeleton-sprint-stats">
            <div class="skeleton-stat"></div>
            <div class="skeleton-stat"></div>
            <div class="skeleton-stat"></div>
          </div>
        </div>
      </ng-container>

      <!-- Board Column Skeleton -->
      <ng-container *ngIf="type === 'board-column'">
        <div class="skeleton-board-columns">
          <div *ngFor="let col of items" class="skeleton-column">
            <div class="skeleton-line skeleton-column-header"></div>
            <div *ngFor="let card of [1,2,3]" class="skeleton-card">
              <div class="skeleton-line skeleton-card-title"></div>
              <div class="skeleton-line skeleton-card-desc"></div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Table Skeleton -->
      <ng-container *ngIf="type === 'table'">
        <div class="skeleton-table">
          <div class="skeleton-table-header">
            <div *ngFor="let col of [1,2,3,4,5]" class="skeleton-line skeleton-table-cell"></div>
          </div>
          <div *ngFor="let row of items" class="skeleton-table-row">
            <div *ngFor="let col of [1,2,3,4,5]" class="skeleton-line skeleton-table-cell"></div>
          </div>
        </div>
      </ng-container>

      <!-- Generic Card Skeleton -->
      <ng-container *ngIf="type === 'card'">
        <div *ngFor="let item of items" class="skeleton-card">
          <div class="skeleton-line skeleton-card-title"></div>
          <div class="skeleton-line skeleton-card-subtitle"></div>
          <div class="skeleton-line skeleton-card-content"></div>
        </div>
      </ng-container>

      <!-- Text Lines Skeleton -->
      <ng-container *ngIf="type === 'text'">
        <div *ngFor="let item of items" class="skeleton-line skeleton-text"></div>
      </ng-container>
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      padding: 16px;
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes shimmer {
      0% {
        background-position: -468px 0;
      }
      100% {
        background-position: 468px 0;
      }
    }

    .skeleton-line,
    .skeleton-pill,
    .skeleton-stat,
    .skeleton-card,
    .skeleton-table-cell {
      background: linear-gradient(
        90deg,
        #f0f0f0 0px,
        #f8f8f8 40px,
        #f0f0f0 80px
      );
      background-size: 600px;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    /* Issue List Skeleton */
    .skeleton-issue-item {
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .skeleton-header {
      width: 120px;
      height: 16px;
      margin-bottom: 8px;
    }

    .skeleton-title {
      width: 80%;
      height: 18px;
      margin-bottom: 8px;
    }

    .skeleton-meta {
      display: flex;
      gap: 8px;
    }

    .skeleton-pill {
      width: 60px;
      height: 20px;
    }

    /* Sprint Card Skeleton */
    .skeleton-sprint-card {
      padding: 16px;
      margin-bottom: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
    }

    .skeleton-sprint-header {
      width: 200px;
      height: 24px;
      margin-bottom: 12px;
    }

    .skeleton-sprint-goal {
      width: 90%;
      height: 16px;
      margin-bottom: 16px;
    }

    .skeleton-sprint-stats {
      display: flex;
      gap: 12px;
    }

    .skeleton-stat {
      width: 80px;
      height: 40px;
    }

    /* Board Column Skeleton */
    .skeleton-board-columns {
      display: flex;
      gap: 16px;
      overflow-x: auto;
    }

    .skeleton-column {
      min-width: 280px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .skeleton-column-header {
      width: 150px;
      height: 24px;
      margin-bottom: 12px;
    }

    .skeleton-card {
      padding: 12px;
      margin-bottom: 8px;
      background: #fff;
      border-radius: 8px;
    }

    .skeleton-card-title {
      width: 90%;
      height: 16px;
      margin-bottom: 8px;
    }

    .skeleton-card-desc,
    .skeleton-card-subtitle {
      width: 70%;
      height: 14px;
      margin-bottom: 6px;
    }

    .skeleton-card-content {
      width: 100%;
      height: 14px;
    }

    /* Table Skeleton */
    .skeleton-table {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .skeleton-table-header,
    .skeleton-table-row {
      display: flex;
      gap: 16px;
      padding: 12px 16px;
    }

    .skeleton-table-header {
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
    }

    .skeleton-table-row {
      border-bottom: 1px solid #f3f4f6;
    }

    .skeleton-table-cell {
      flex: 1;
      height: 20px;
    }

    /* Text Skeleton */
    .skeleton-text {
      width: 100%;
      height: 16px;
      margin-bottom: 8px;
    }
  `]
})
export class LoadingSkeleton {
  @Input() type: 'issue-list' | 'sprint-card' | 'board-column' | 'table' | 'card' | 'text' = 'card';
  @Input() count: number = 3;

  get items(): number[] {
    return Array(this.count).fill(0).map((_, i) => i);
  }
}
