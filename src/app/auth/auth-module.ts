import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    LoginComponent
  ],
  exports: [
    LoginComponent
  ]
})
export class AuthModule { }
