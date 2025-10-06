import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalService, FormField } from '../modal-service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-create-issue',
  templateUrl: './create-issue.html',
  styleUrls: ['./create-issue.css'],
  standalone: true,
  imports: [NgIf, NgFor, FormsModule]
})
export class CreateIssue implements OnInit, OnDestroy {
  @Input() modalId = 'createIssue';
  
  show = false;
  private sub!: Subscription;
  private isBrowser: boolean;

  // Form
  formData: any = { labels: [], attachments: [] };
  fields: FormField[] = [];

  // Dynamic title/project
  modalTitle = 'Create Issue';
  projectName = 'Project Alpha';
  showLabels = false;


  constructor(
    private modalService: ModalService,
    @Inject(PLATFORM_ID) platformId: Object
  ) { this.isBrowser = isPlatformBrowser(platformId); }

  ngOnInit() {
  this.sub = this.modalService.activeModal$.subscribe(id => {
    const cfg = this.modalService.getConfig(id ?? '');
    this.show = !!cfg; // show only if config exists
    if (cfg) {
      this.fields = cfg.fields ?? [];
      this.formData = cfg.data ? { ...cfg.data } : { labels: [], attachments: [] };
      this.modalTitle = cfg.title ?? 'Modal';
      this.projectName = cfg.projectName ?? '';
      this.showLabels = cfg.showLabels ?? false;
    }

    if (this.isBrowser) document.body.style.overflow = this.show ? 'hidden' : '';
  });
}


  ngOnDestroy() {
    this.sub.unsubscribe();
    if (this.isBrowser) document.body.style.overflow = '';
  }

  close() { this.modalService.close(); }

  submit() {
    console.log('Form submitted:', this.formData);
    this.close();
  }

  handleChange(value: any, field: FormField) {
    if(field.onChange) field.onChange(value, this.formData);
  }

  handleFileSelect(event: any, field: FormField) {
    this.formData[field.model] = Array.from(event.target.files);
    field.onChange?.(this.formData[field.model], this.formData);
  }

  addLabel(label: string) {
    if (label && !this.formData.labels.includes(label)) this.formData.labels.push(label);
  }

  removeLabel(label: string) {
    this.formData.labels = this.formData.labels.filter((l: string) => l !== label);
  }
}
