import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from './timeline-component/timeline-component';
import { TimelineChart } from './timeline-chart/timeline-chart';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,TimelineComponent,TimelineChart
  ],
  exports:[
    TimelineComponent
  ]
})
export class TimelineModule { }
