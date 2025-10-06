import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainDashboardHome } from './main-dashboard-home';

describe('MainDashboardHome', () => {
  let component: MainDashboardHome;
  let fixture: ComponentFixture<MainDashboardHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainDashboardHome]
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
