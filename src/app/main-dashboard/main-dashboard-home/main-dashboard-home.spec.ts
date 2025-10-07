import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

import { MainDashboardHome } from './main-dashboard-home';

describe('MainDashboardHome', () => {
  let component: MainDashboardHome;
  let fixture: ComponentFixture<MainDashboardHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainDashboardHome, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map() } } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainDashboardHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
