import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalService, FormField } from '../modal-service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-create-issue',
  templateUrl: './create-issue.html',
  styleUrls: ['./create-issue.css'],
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, NgClass]
})
export class CreateIssue implements OnInit, OnDestroy {
  
  show = false;
  private sub!: Subscription;
  private isBrowser: boolean;

  // Form
  formData: any = { labels: [], attachments: [] };
  fields: FormField[] = [];
  invalidFields: Set<string> = new Set();

  // Dynamic title/project
  modalTitle = '';
  projectName = '';
  modalDesc = '';
  showLabels = false;
  submitButtonText = '';


  formError: string = '';
  showErrorToast = false;

showToast(message: string, duration: number = 3000) {
  this.formError = message;
  this.showErrorToast = true;

  setTimeout(() => {
    this.showErrorToast = false;
    this.formError = '';
  }, duration);
}


  constructor(
    private modalService: ModalService,
    @Inject(PLATFORM_ID) platformId: Object
  ) { this.isBrowser = isPlatformBrowser(platformId); }

  ngOnInit() {
  this.sub = this.modalService.activeModal$.subscribe((id) => {
    if (!id) {
      this.show = false;
      if (this.isBrowser) document.body.style.overflow = '';
      return;
    }

    const cfg = this.modalService.getConfig(id);
    this.show = !!cfg;

    if (cfg) {
      this.fields = cfg.fields ?? [];
      this.formData = cfg.data ? { ...cfg.data } : { labels: [], attachments: [] };
      this.modalTitle = cfg.title ?? 'Modal';
      this.projectName = cfg.projectName ?? '';
      this.modalDesc = cfg.modalDesc ?? '';
      this.showLabels = cfg.showLabels ?? false;
      this.submitButtonText = cfg.submitText ?? 'Create Issue';
      
      // Check initial issue type and update field visibility
      if (this.formData.issueType) {
        this.updateFieldVisibility(this.formData.issueType);
      }
    }

    if (this.isBrowser) document.body.style.overflow = this.show ? 'hidden' : '';
  });
}



  ngOnDestroy() {
    // subscription may not have been created in some tests; guard before unsubscribing
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.isBrowser) document.body.style.overflow = '';
  }

close() { 
  this.formError = ''; // reset error
  this.invalidFields.clear(); // also clear invalid highlights
  this.modalService.close(); 
}


shakeFields: Set<string> = new Set();

submit() {
  this.invalidFields.clear();
  this.shakeFields.clear(); // reset shakes

  // Validate required fields (skip hidden fields)
  for (const field of this.fields) {
    if (field.hidden) continue; // Skip validation for hidden fields
    
    const value = this.formData[field.model];
    if (field.required && (value === null || value === undefined || value === '')) {
      this.invalidFields.add(field.model);
      this.shakeFields.add(field.model); // mark for shake
    }
  }

  if (this.invalidFields.size > 0) {
    // Remove shake class after animation ends (so it can trigger again next submit)
    setTimeout(() => this.shakeFields.clear(), 500);

    // Scroll to first invalid field
    setTimeout(() => {
      const firstInvalid = document.querySelector('.input-error');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);

    // Show toast
    this.showToast('Please fill all required fields before submitting.');
    return;
  }

  console.log('Form submitted successfully:', this.formData);
  this.close();
}



  handleChange(value: any, field: FormField) {
    this.formData[field.model] = value;

    // ✅ If field is required and filled, remove from invalid list
    if (field.required && value) {
      this.invalidFields.delete(field.model);
    }

    // Handle Issue Type change to show/hide fields
    if (field.model === 'issueType') {
      this.updateFieldVisibility(value);
    }

    field.onChange?.(value, this.formData);
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

  updateFieldVisibility(issueType: string) {
    // Hide Story Point and Parent Epic when Issue Type is Epic
    const hideFields = issueType === 'Epic';
    
    this.fields.forEach(field => {
      if (field.model === 'storyPoint' || field.model === 'parentEpic') {
        field.hidden = hideFields;
        
        // Clear validation errors for hidden fields
        if (hideFields) {
          this.invalidFields.delete(field.model);
          this.shakeFields.delete(field.model);
        }
      }
    });
  }
}
