import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalConfig {
  id: string;                 // modal identifier
  title?: string;             // modal header
  projectName?: string;       // optional project label
  modalDesc? : string;
  fields?: FormField[];       // dynamic fields
  data?: any;                 // pre-filled form values
  showLabels?: boolean;
  submitText?: string;   
}

export interface FormField {
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'date' | 'file';
  model: string;
  options?: string[];
  colSpan?: 1 | 2;
  onChange?: (value: any, formData: any) => void;
  required?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private activeModalSubject = new BehaviorSubject<string | null>(null);
  activeModal$ = this.activeModalSubject.asObservable();

  private modalData: Record<string, ModalConfig> = {};

  open(config: ModalConfig) {
    this.modalData[config.id] = config;
    this.activeModalSubject.next(config.id);
  }

  close() {
    this.activeModalSubject.next(null);
  }

  getConfig(modalId: string): ModalConfig | undefined {
    return this.modalData[modalId];
  }
  
}
