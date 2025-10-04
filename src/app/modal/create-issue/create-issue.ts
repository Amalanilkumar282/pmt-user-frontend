import { NgFor, NgIf } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalService } from '../modal-service';
import { FormsModule } from '@angular/forms';

interface FormField {
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'date' | 'file';
  model: string;
  options?: string[];
  required?: boolean;
  colSpan?: 1 | 2; // 1 = single column, 2 = full width
}

@Component({
  selector: 'app-create-issue',
  templateUrl: './create-issue.html',
  styleUrls: ['./create-issue.css'],
  standalone: true,
  imports:[NgIf, FormsModule, NgFor]
})
export class CreateIssue implements OnInit, OnDestroy {
  @Input() modalId = 'createIssue';
  show = false;
  private sub!: Subscription;
  private isBrowser: boolean;

  // Form data object
  formData: any = {
    issueType: '',
    summary: '',
    description: '',
    priority: 'medium',
    assignee: '',
    startDate: '',
    dueDate: '',
    sprint: '',
    storyPoints: null,
    parentEpic: '',
    reporter: '',
    labels: [],
    attachments: []
  };

  // Fields configuration
  fields: FormField[] = [
  { label: 'Issue Type', type: 'select', model: 'issueType', options: ['Epic', 'Bug','Task','Story'], colSpan: 2 },
  { label: 'Summary', type: 'text', model: 'summary', colSpan: 2 },
  { label: 'Description', type: 'textarea', model: 'description', colSpan: 2 },
  { label: 'Priority', type: 'select', model: 'priority', options: ['High','Medium','Low'], colSpan: 1 },
  { label: 'Assignee', type: 'select', model: 'assignee', options: ['Jacob','Clara','Zac'], colSpan: 1 },
  { label: 'Start Date', type: 'date', model: 'startDate', colSpan: 1 },
  { label: 'Due Date', type: 'date', model: 'dueDate', colSpan: 1 },
  { label: 'Sprint', type: 'select', model: 'sprint', options: ['Sprint 1','Sprint 2','Sprint 3'], colSpan: 1 },
  { label: 'Story Point', type: 'number', model: 'storyPoints',  colSpan: 1 },
  { label: 'Parent Epic', type: 'select', model: 'parentEpic', options: ['Epic 1','Epic 2','Epic 3','Epic 4'], colSpan: 1 },
  { label: 'Reporter', type: 'select', model: 'reporter', options: ['Jacob','Clara','Zac'], colSpan: 1 }
];

  constructor(
    private modalService: ModalService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.sub = this.modalService.activeModal$.subscribe(id => {
      this.show = id === this.modalId;
      if (this.isBrowser) document.body.style.overflow = this.show ? 'hidden' : '';
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    if (this.isBrowser) document.body.style.overflow = '';
  }

  close() {
    this.modalService.close();
  }

  submit() {
    console.log('Form submitted:', this.formData);
    this.close();
  }

  handleFileSelect(event: any) {
    this.formData.attachments = Array.from(event.target.files);
  }

  addLabel(label: string) {
    if (label && !this.formData.labels.includes(label)) this.formData.labels.push(label);
  }

  removeLabel(label: string) {
    this.formData.labels = this.formData.labels.filter((l: string) => l !== label);
  }
}
