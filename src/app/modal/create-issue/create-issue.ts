import { NgIf } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalService } from '../modal-service';

@Component({
  selector: 'app-create-issue',
  templateUrl: './create-issue.html',
  styleUrls: ['./create-issue.css'],
  standalone: true,
  imports:[NgIf]
})
export class CreateIssue implements OnInit, OnDestroy {
  @Input() modalId = 'createIssue';
  show = false;
  private sub!: Subscription;
  private isBrowser: boolean;

  constructor(
    private modalService: ModalService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.sub = this.modalService.activeModal$.subscribe(id => {
      this.show = id === this.modalId;
      if (this.isBrowser) {
        document.body.style.overflow = this.show ? 'hidden' : '';
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    if (this.isBrowser) document.body.style.overflow = '';
  }

  close() {
    this.modalService.close();
  }
  
}
