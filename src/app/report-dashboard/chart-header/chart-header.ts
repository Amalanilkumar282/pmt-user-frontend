import { Component,Input,EventEmitter,Output } from '@angular/core';

export interface SprintOption {
  id: string;
  name: string;
}
@Component({
  selector: 'app-chart-header',
  imports: [],
  templateUrl: './chart-header.html',
  styleUrl: './chart-header.css'
})

export class ChartHeader {
  @Input() title: string = '';
  @Output() back = new EventEmitter<void>();
  

  onBack() {
    this.back.emit();
  }

   

}
