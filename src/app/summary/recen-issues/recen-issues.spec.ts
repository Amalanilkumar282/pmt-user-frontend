import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecenIssues } from './recen-issues';

describe('RecenIssues', () => {
  let component: RecenIssues;
  let fixture: ComponentFixture<RecenIssues>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecenIssues]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecenIssues);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
