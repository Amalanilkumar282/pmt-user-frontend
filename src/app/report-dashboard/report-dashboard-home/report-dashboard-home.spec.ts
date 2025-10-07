import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportDashboardHome } from './report-dashboard-home';
import { provideRouter } from '@angular/router';
describe('ReportDashboardHome', () => {
  let component: ReportDashboardHome;
  let fixture: ComponentFixture<ReportDashboardHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportDashboardHome ],
      providers: [
    provideRouter([]) // ✅ sets up router providers like ActivatedRoute
  ]
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
