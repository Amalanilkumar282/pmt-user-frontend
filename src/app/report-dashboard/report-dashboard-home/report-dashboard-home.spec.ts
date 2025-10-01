import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportDashboardHome } from './report-dashboard-home';

describe('ReportDashboardHome', () => {
  let component: ReportDashboardHome;
  let fixture: ComponentFixture<ReportDashboardHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportDashboardHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportDashboardHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
