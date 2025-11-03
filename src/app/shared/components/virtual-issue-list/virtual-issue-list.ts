import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Issue } from '../../models/issue.model';

@Component({
  selector: 'app-virtual-issue-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport 
      [itemSize]="itemHeight" 
      [style.height.px]="viewportHeight"
      class="virtual-scroll-viewport"
      (scrolledIndexChange)="onScrollIndexChange($event)">
      
      <div *cdkVirtualFor="let issue of issues; let i = index" 
           class="issue-item"
           [style.height.px]="itemHeight"
           (click)="onIssueClick(issue)">
        
        <div class="issue-content">
          <div class="issue-header">
            <span class="issue-key">{{ issue.key }}</span>
            <span class="issue-type" [ngClass]="'type-' + issue.type">
              {{ issue.type }}
            </span>
          </div>
          
          <div class="issue-title">{{ issue.title }}</div>
          
          <div class="issue-meta">
            <span class="priority" [ngClass]="'priority-' + issue.priority">
              {{ issue.priority }}
            </span>
            <span class="status" [ngClass]="'status-' + issue.status">
              {{ issue.status }}
            </span>
            <span class="story-points" *ngIf="issue.storyPoints">
              {{ issue.storyPoints }} SP
            </span>
          </div>
        </div>
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .virtual-scroll-viewport {
      width: 100%;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow-y: auto;
    }

    .issue-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .issue-item:hover {
      background-color: #f9fafb;
    }

    .issue-content {
      flex: 1;
      min-width: 0;
    }

    .issue-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .issue-key {
      font-weight: 600;
      color: #3b82f6;
      font-size: 12px;
    }

    .issue-type {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .type-STORY { background: #dbeafe; color: #1e40af; }
    .type-BUG { background: #fee2e2; color: #991b1b; }
    .type-TASK { background: #e0e7ff; color: #3730a3; }
    .type-EPIC { background: #f3e8ff; color: #6b21a8; }

    .issue-title {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      margin-bottom: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .issue-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
    }

    .priority, .status, .story-points {
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 500;
    }

    .priority-HIGH { background: #fef3c7; color: #92400e; }
    .priority-MEDIUM { background: #dbeafe; color: #1e40af; }
    .priority-LOW { background: #d1fae5; color: #065f46; }

    .status-TODO { background: #f3f4f6; color: #374151; }
    .status-IN_PROGRESS { background: #dbeafe; color: #1e40af; }
    .status-IN_REVIEW { background: #fef3c7; color: #92400e; }
    .status-DONE { background: #d1fae5; color: #065f46; }
    .status-BLOCKED { background: #fee2e2; color: #991b1b; }

    .story-points {
      background: #f3f4f6;
      color: #6b7280;
    }
  `]
})
export class VirtualIssueList implements OnInit {
  @Input() issues: Issue[] = [];
  @Input() itemHeight: number = 80; // Height of each issue item in pixels
  @Input() viewportHeight: number = 600; // Height of the viewport
  @Input() loadMoreThreshold: number = 10; // Trigger load when this many items from bottom
  
  @Output() issueClicked = new EventEmitter<Issue>();
  @Output() loadMore = new EventEmitter<void>();
  
  @ViewChild(CdkVirtualScrollViewport) viewport?: CdkVirtualScrollViewport;

  ngOnInit(): void {
    console.log('VirtualIssueList initialized with', this.issues.length, 'issues');
  }

  onIssueClick(issue: Issue): void {
    this.issueClicked.emit(issue);
  }

  onScrollIndexChange(index: number): void {
    const end = this.viewport?.getRenderedRange().end || 0;
    const total = this.issues.length;
    
    // Trigger load more when near the end
    if (total - end < this.loadMoreThreshold) {
      this.loadMore.emit();
    }
  }
}
