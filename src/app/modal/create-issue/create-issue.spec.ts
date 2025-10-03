import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateIssue } from './create-issue';

describe('CreateIssue', () => {
  let component: CreateIssue;
  let fixture: ComponentFixture<CreateIssue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateIssue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateIssue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
