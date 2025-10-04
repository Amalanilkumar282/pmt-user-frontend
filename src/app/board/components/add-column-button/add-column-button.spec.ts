import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddColumnButton } from './add-column-button';

describe('AddColumnButton', () => {
  let component: AddColumnButton;
  let fixture: ComponentFixture<AddColumnButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddColumnButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddColumnButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
