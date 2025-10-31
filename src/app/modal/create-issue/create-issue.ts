import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { NgIf, NgFor, NgClass, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalService, FormField } from '../modal-service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-create-issue',
  templateUrl: './create-issue.html',
  styleUrls: ['./create-issue.css'],
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, NgClass, NgStyle]
})
export class CreateIssue implements OnInit, OnDestroy {
  private activeModalId: string | null = null;
  isArray(val: any): boolean {
    return Array.isArray(val);
  }

  // Icon mapping for issue types
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'STORY': 'fa-solid fa-book',
      'TASK': 'fa-solid fa-check-circle',
      'BUG': 'fa-solid fa-bug',
      'EPIC': 'fa-solid fa-bolt',
      'FEATURE': 'fa-solid fa-star',
      'CRITICAL': 'fa-solid fa-fire',
      'OTHER': 'fa-solid fa-file'
    };
    // Accept both uppercase and capitalized types
    const key = (type || '').toUpperCase();
    return icons[key] || icons['OTHER'];
  }
  
  // Track mousedown on overlay
  private mouseDownOnOverlay = false;

  onOverlayMouseDown(event: MouseEvent) {
    this.mouseDownOnOverlay = event.target === event.currentTarget;
  }

  onOverlayClick(event: MouseEvent) {
    // Only close if both mousedown and click happened on overlay
    if (this.mouseDownOnOverlay && event.target === event.currentTarget) {
      this.close();
    }
    this.mouseDownOnOverlay = false;
  }

  // Popup state for editing label
  editingLabel: string | null = null;
  editLabelName: string = '';
  editLabelColor: string = '';

  openEditLabel(label: string) {
    this.editingLabel = label;
    this.editLabelName = label;
    this.editLabelColor = this.labelColors[label] || this.getRandomPastelColor();
  }

  closeEditLabel() {
    this.editingLabel = null;
    this.editLabelName = '';
    this.editLabelColor = '';
  }

  saveEditLabel() {
    if (!this.editingLabel) return;
    const oldLabel = this.editingLabel;
    const newLabel = this.editLabelName.trim();
    if (!newLabel) return;
    // Update label in formData.labels
    const idx = this.formData.labels.indexOf(oldLabel);
    if (idx !== -1) {
      this.formData.labels[idx] = newLabel;
      // Update color mapping
      this.labelColors[newLabel] = this.editLabelColor;
      if (oldLabel !== newLabel) {
        delete this.labelColors[oldLabel];
      }
    }
    // Update availableLabels
    if (!this.availableLabels.includes(newLabel)) {
      this.availableLabels.push(newLabel);
    }
    this.closeEditLabel();
  }

  onEditColorInput(event: any) {
    this.editLabelColor = event.target.value;
  }
  // Simulated backend label storage (replace with API call in future)
  availableLabels: string[] = ['bug', 'feature', 'urgent', 'frontend', 'backend', 'enhancement', 'help wanted'];
  labelInputValue: string = '';
  showLabelDropdown: boolean = false;
  filteredLabels: string[] = [];
  labelColors: { [label: string]: string } = {};

  onLabelInput(value: string) {
    this.labelInputValue = value;
    if (value.trim().length === 0) {
      this.showLabelDropdown = false;
      this.filteredLabels = [];
      return;
    }
    // Filter available labels that match input and are not already selected
    const lower = value.toLowerCase();
    this.filteredLabels = this.availableLabels.filter(l => l.toLowerCase().includes(lower) && !this.formData.labels.includes(l));
    this.showLabelDropdown = this.filteredLabels.length > 0;
  }

  getRandomPastelColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`;
  }

  selectLabel(label: string) {
    if (!this.formData.labels.includes(label)) {
      this.formData.labels.push(label);
      if (!this.labelColors[label]) {
        this.labelColors[label] = this.getRandomPastelColor();
      }
    }
    this.labelInputValue = '';
    this.showLabelDropdown = false;
    this.filteredLabels = [];
  }

  removeFile(fieldModel: string, index: number) {
    if (Array.isArray(this.formData[fieldModel])) {
      this.formData[fieldModel].splice(index, 1);
    }
  }
  
  show = false;
  private sub!: Subscription;
  private isBrowser: boolean;

  // Form
  formData: any = { labels: [], attachments: [] };
  fields: FormField[] = [];
  invalidFields: Set<string> = new Set();

  // Dynamic title
  modalTitle = '';
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
      this.activeModalId = id;
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
        // Ensure all file fields are initialized as arrays
        for (const field of this.fields) {
          if (field.type === 'file') {
            if (!Array.isArray(this.formData[field.model])) {
              this.formData[field.model] = [];
            }
          }
          // Add showDropdown property for issueType field for custom dropdown
          if (field.type === 'select' && field.model === 'issueType' && field.showDropdown === undefined) {
            (field as any).showDropdown = false;
          }
        }
        this.modalTitle = cfg.title ?? 'Modal';
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
      if (field.model === 'storyPoint' && value !== undefined && value !== null && value < 0) {
        this.invalidFields.add(field.model);
        this.shakeFields.add(field.model);
        this.showToast('Story Points cannot be negative.');
        setTimeout(() => this.shakeFields.clear(), 500);
        return;
      }
      if (field.required && (value === null || value === undefined || value === '')) {
        this.invalidFields.add(field.model);
        this.shakeFields.add(field.model); // mark for shake
      }
    }

    // Additional validation: start date should be before or on due date
    const startDate = this.formData['startDate'];
    const dueDate = this.formData['dueDate'];
    if (startDate && dueDate) {
      const start = new Date(startDate);
      const due = new Date(dueDate);
      if (start > due) {
        this.invalidFields.add('startDate');
        this.invalidFields.add('dueDate');
        this.shakeFields.add('startDate');
        this.shakeFields.add('dueDate');
        this.showToast('Start date must be before or on Due date.');
        setTimeout(() => this.shakeFields.clear(), 500);
        return;
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

    // If modal config has onSubmit, call it
    if (this.activeModalId) {
      const cfg = this.modalService.getConfig(this.activeModalId);
      if (cfg && typeof cfg.onSubmit === 'function') {
        cfg.onSubmit(this.formData);
        return;
      }
    }

    // No backend integration: just log and close
    console.log('Form submitted (no API):', this.formData);
    this.showToast('Issue saved locally (no backend).', 1500);
    this.close();
  }



  handleChange(value: any, field: FormField) {
    // Prevent negative story points
    if (field.model === 'storyPoint' && value < 0) {
      this.formData[field.model] = 0;
      this.showToast('Story Points cannot be negative.');
      return;
    } else {
      this.formData[field.model] = value;
    }

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
    // Always convert FileList to array for display
    this.formData[field.model] = event.target.files ? Array.from(event.target.files) : [];
    field.onChange?.(this.formData[field.model], this.formData);
  }

  addLabel(label: string) {
    if (label && !this.formData.labels.includes(label)) {
      this.formData.labels.push(label);
      if (!this.labelColors[label]) {
        this.labelColors[label] = this.getRandomPastelColor();
      }
      // Optionally add to availableLabels for future suggestions
      if (!this.availableLabels.includes(label)) {
        this.availableLabels.push(label);
      }
    }
    this.labelInputValue = '';
    this.showLabelDropdown = false;
    this.filteredLabels = [];
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
