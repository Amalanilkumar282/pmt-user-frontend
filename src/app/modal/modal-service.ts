import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private activeModalSubject = new BehaviorSubject<string | null>(null);
  activeModal$ = this.activeModalSubject.asObservable();

  open(id: string) {
    this.activeModalSubject.next(id);
  }

  close() {
    this.activeModalSubject.next(null);
  }

  isOpen(id: string): boolean {
    return this.activeModalSubject.getValue() === id;
  }
}
