import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModalService {
  // Holds the ID of the currently open modal (or null if none)
  private activeModalSource = new BehaviorSubject<string | null>(null);
  activeModal$ = this.activeModalSource.asObservable();

  open(modalId: string) {
    this.activeModalSource.next(modalId);
  }

  close() {
    this.activeModalSource.next(null);
  }
}
