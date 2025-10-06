import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectLead } from './project-lead';

describe('ProjectLead', () => {
  let component: ProjectLead;
  let fixture: ComponentFixture<ProjectLead>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectLead]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectLead);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
