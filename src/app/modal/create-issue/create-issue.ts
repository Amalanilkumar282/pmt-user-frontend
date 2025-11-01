import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { NgIf, NgFor, NgClass, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalService, FormField } from '../modal-service';
import { isPlatformBrowser } from '@angular/common';
import { LabelService, Label, CreateLabelRequest, UpdateLabelRequest } from '../../shared/services/label.service';
import { AttachmentService } from '../../shared/services/attachment.service';

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
    const oldLabelName = this.editingLabel;
    const newLabelName = this.editLabelName.trim();
    if (!newLabelName) return;

    // Find the label in backend labels to get its ID
    const labelToUpdate = this.backendLabels.find(l => l.name === oldLabelName);
    
    if (labelToUpdate) {
      // Label exists in backend - update via API
      const updateRequest: UpdateLabelRequest = {
        id: labelToUpdate.id,
        name: newLabelName,
        colour: this.editLabelColor
      };

      // Optimistic update - update UI immediately
      const idx = this.formData.labels.indexOf(oldLabelName);
      if (idx !== -1) {
        this.formData.labels[idx] = newLabelName;
        this.labelColors[newLabelName] = this.editLabelColor;
        if (oldLabelName !== newLabelName) {
          delete this.labelColors[oldLabelName];
        }
      }

      // Update in backend labels array
      labelToUpdate.name = newLabelName;
      labelToUpdate.colour = this.editLabelColor;

      // Call API to update in backend
      this.labelService.updateLabel(updateRequest).subscribe({
        next: (response) => {
          console.log('Label updated successfully:', response);
        },
        error: (err) => {
          console.error('Failed to update label:', err);
          // Revert changes if API fails
          if (idx !== -1) {
            this.formData.labels[idx] = oldLabelName;
            this.labelColors[oldLabelName] = labelToUpdate.colour;
            if (oldLabelName !== newLabelName) {
              delete this.labelColors[newLabelName];
            }
          }
          labelToUpdate.name = oldLabelName;
        }
      });
    } else {
      // Label doesn't exist in backend (local only) - just update locally
      const idx = this.formData.labels.indexOf(oldLabelName);
      if (idx !== -1) {
        this.formData.labels[idx] = newLabelName;
        this.labelColors[newLabelName] = this.editLabelColor;
        if (oldLabelName !== newLabelName) {
          delete this.labelColors[oldLabelName];
        }
      }
    }

    this.closeEditLabel();
  }

  onEditColorInput(event: any) {
    this.editLabelColor = event.target.value;
  }
  // Available labels from backend
  backendLabels: Label[] = [];
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
    // Filter backend labels that match input and are not already selected
    const lower = value.toLowerCase();
    this.filteredLabels = this.backendLabels
      .filter(label => 
        label && label.name && label.name.toLowerCase().includes(lower) && 
        !this.formData.labels.includes(label.name)
      )
      .map(label => label.name);
    this.showLabelDropdown = this.filteredLabels.length > 0;
  }

  getRandomPastelColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`;
  }

  selectLabel(label: string) {
    if (!this.formData.labels.includes(label)) {
      this.formData.labels.push(label);
      // Color is already set from backend in loadLabelsFromBackend()
      // If for some reason it's not there, use a fallback
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
  uploadedFileUrl: string | null = null; // Store the uploaded file URL

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
    private labelService: LabelService,
    private attachmentService: AttachmentService,
    @Inject(PLATFORM_ID) platformId: Object
  ) { this.isBrowser = isPlatformBrowser(platformId); }

  ngOnInit() {
    // Load labels from backend
    this.loadLabelsFromBackend();

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

  loadLabelsFromBackend() {
    this.labelService.getAllLabels().subscribe({
      next: (response) => {
        console.log('Labels fetched from backend:', response);
        this.backendLabels = response.data;
        // Map backend colors to labelColors
        response.data.forEach(label => {
          this.labelColors[label.name] = label.colour;
        });
      },
      error: (err) => {
        console.error('Failed to fetch labels:', err);
        // Fallback to empty array if API fails
        this.backendLabels = [];
      }
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
        // Include uploaded file URL in formData
        const submissionData = {
          ...this.formData,
          uploadedFileUrl: this.uploadedFileUrl
        };
        cfg.onSubmit(submissionData);
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
    
    // Upload file to Supabase if a file was selected
    if (event.target.files && event.target.files.length > 0) {
      const file: File = event.target.files[0]; // Get the first file
      
      console.log('Uploading file to Supabase:', file.name);
      
      this.attachmentService.uploadFile(file, 'attachments').subscribe({
        next: (response) => {
          console.log('File uploaded successfully:', response);
          this.uploadedFileUrl = response.data; // Store the URL
          console.log('Stored attachment URL:', this.uploadedFileUrl);
        },
        error: (error) => {
          console.error('Error uploading file:', error);
          this.showToast('Failed to upload file. Please try again.');
          this.uploadedFileUrl = null;
        }
      });
    } else {
      this.uploadedFileUrl = null;
    }
    
    field.onChange?.(this.formData[field.model], this.formData);
  }

  addLabel(label: string) {
    if (!label || label.trim() === '') return;

    const trimmedLabel = label.trim();

    // If label already selected, don't add it again
    if (this.formData.labels.includes(trimmedLabel)) {
      this.labelInputValue = '';
      this.showLabelDropdown = false;
      this.filteredLabels = [];
      return;
    }

    // Check if label exists in backend labels
    const existingLabel = this.backendLabels.find(l => l.name.toLowerCase() === trimmedLabel.toLowerCase());

    if (existingLabel) {
      // Label exists in backend, just add it to formData
      this.formData.labels.push(existingLabel.name);
      if (!this.labelColors[existingLabel.name]) {
        this.labelColors[existingLabel.name] = existingLabel.colour;
      }
      this.labelInputValue = '';
      this.showLabelDropdown = false;
      this.filteredLabels = [];
    } else {
      // Label doesn't exist - create it in backend
      const randomColor = this.getRandomPastelColor();
      const createRequest: CreateLabelRequest = {
        name: trimmedLabel,
        colour: randomColor
      };

      // Add label immediately (optimistic update) for instant UI feedback
      this.formData.labels.push(trimmedLabel);
      this.labelColors[trimmedLabel] = randomColor;

      // Clear input immediately for better UX
      this.labelInputValue = '';
      this.showLabelDropdown = false;
      this.filteredLabels = [];

      this.labelService.createLabel(createRequest).subscribe({
        next: (response) => {
          console.log('Label created successfully:', response);
          const newLabel = response.data;
          
          // Add to backend labels
          this.backendLabels.push(newLabel);
          
          // Update color with backend color if different
          if (newLabel.colour !== randomColor) {
            this.labelColors[newLabel.name] = newLabel.colour;
          }
        },
        error: (err) => {
          console.error('Failed to create label:', err);
          // Label already added optimistically, no need to add again
        }
      });
    }
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
