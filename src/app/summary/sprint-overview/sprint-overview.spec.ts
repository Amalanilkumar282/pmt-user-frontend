import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SprintOverview } from './sprint-overview';

describe('SprintOverview', () => {
  let component: SprintOverview;
  let fixture: ComponentFixture<SprintOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SprintOverview] }).compileComponents();
    fixture = TestBed.createComponent(SprintOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('getColors returns mapped colors for known classes and fallback for unknown', () => {
    component.statuses = [
      { label: 'A', count: 1, colorClass: 'bg-status-green' },
      { label: 'B', count: 2, colorClass: 'unknown-class' },
    ];
    const colors = (component as any).getColors();
    expect(colors.length).toBe(2);
    expect(colors[0]).toBe('#10B981');
    expect(colors[1]).toBe('#6B7280');
  });

  it('ngOnDestroy should call destroy on chart if present', () => {
    (component as any).chart = { destroy: jasmine.createSpy('destroy') };
    component.ngOnDestroy();
    expect((component as any).chart.destroy).toHaveBeenCalled();
  });
});
