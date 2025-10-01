import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CreateIssue } from './modal/create-issue/create-issue';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CreateIssue],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

}
