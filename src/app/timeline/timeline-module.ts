import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from './timeline-component/timeline-component';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,TimelineComponent
  ],
  exports:[
    TimelineComponent
  ]
})
export class TimelineModule { }
