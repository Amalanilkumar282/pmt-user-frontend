// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { TimelineChart } from './timeline-chart';
// import { NO_ERRORS_SCHEMA } from '@angular/core';

// describe('TimelineChart', () => {
//   let component: TimelineChart;
//   let fixture: ComponentFixture<TimelineChart>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       declarations: [TimelineChart],
//       schemas: [NO_ERRORS_SCHEMA]
//     }).compileComponents();

//     fixture = TestBed.createComponent(TimelineChart);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   // ---------- BASIC CREATION ----------
//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   // ---------- VIEW / FILTER METHODS ----------
//   it('should update currentView when onViewChanged is called', () => {
//     component.onViewChanged('month');
//     expect(component.currentView).toBe('month');
//   });

//   it('should toggle a filter when onFilterToggled is called', () => {
//     const filter = 'done';
//     component.selectedFilters = new Set();
//     component.onFilterToggled(filter);
//     expect(component.selectedFilters.has(filter)).toBeTrue();

//     component.onFilterToggled(filter);
//     expect(component.selectedFilters.has(filter)).toBeFalse();
//   });

//   it('should clear filters when onFiltersCleared is called', () => {
//     component.selectedFilters = new Set(['done', 'in-progress']);
//     component.onFiltersCleared();
//     expect(component.selectedFilters.size).toBe(0);
//   });

//   it('should handle backToEpics event', () => {
//     component.selectedEpic = { id: 'E1', name: 'Epic One' } as any;
//     component.onBackToEpics();
//     expect(component.selectedEpic).toBeNull();
//   });

//   // ---------- ROW HANDLING ----------
//   it('should toggle a row by id', () => {
//     component.expandedRows = new Set(['r1']);
//     component.toggleRow('r1');
//     expect(component.expandedRows.has('r1')).toBeFalse();

//     component.toggleRow('r2');
//     expect(component.expandedRows.has('r2')).toBeTrue();
//   });

//   it('should check if a row is expanded', () => {
//     component.expandedRows = new Set(['row123']);
//     expect(component.isRowExpanded('row123')).toBeTrue();
//     expect(component.isRowExpanded('other')).toBeFalse();
//   });

//   // ---------- CALCULATION METHODS ----------
//   it('should return a positive bar width for valid dates', () => {
//     const start = new Date('2024-01-01');
//     const end = new Date('2024-01-10');
//     const width = component.getBarWidth(start, end);
//     expect(width).toBeGreaterThan(0);
//   });

//   it('should return zero for invalid bar width inputs', () => {
//     expect(component.getBarWidth(null as any, null as any)).toBe(0);
//   });

//   it('should return a number for bar position', () => {
//     const pos = component.getBarPosition(new Date());
//     expect(typeof pos).toBe('number');
//   });

//   it('should return today position as a number', () => {
//     const pos = component.getTodayPosition();
//     expect(typeof pos).toBe('number');
//   });

//   // ---------- STATUS + ICON HELPERS ----------
//   it('should return correct class for each status', () => {
//     expect(component.getStatusBadgeClass('done')).toContain('bg-green');
//     expect(component.getStatusBadgeClass('in-progress')).toContain('bg-blue');
//     expect(component.getStatusBadgeClass('in-review')).toContain('bg-orange');
//     expect(component.getStatusBadgeClass('todo')).toContain('bg-gray');
//   });

//   it('should return correct icon for issue types', () => {
//     expect(component.getTypeIcon('bug')).toBeDefined();
//     expect(component.getTypeIcon('task')).toBeDefined();
//   });

//   // ---------- ROW COUNT + HEIGHT ----------
//   it('should return correct visible row count', () => {
//     component.timelineRows = [
//       { visible: true },
//       { visible: false },
//       { visible: true }
//     ] as any;
//     expect(component.getVisibleRowCount()).toBe(2);
//   });

//   it('should return valid container height', () => {
//     const height = component.getContainerHeight();
//     expect(typeof height).toBe('number');
//   });

//   // ---------- EVENT + SCROLL HANDLERS ----------
//   it('should handle sidebar scroll without errors', () => {
//     const event = { target: { scrollTop: 10 } } as any;
//     expect(() => component.onSidebarScroll(event)).not.toThrow();
//   });

//   it('should handle header scroll without errors', () => {
//     const event = { target: { scrollLeft: 10 } } as any;
//     expect(() => component.onHeaderScroll(event)).not.toThrow();
//   });

//   it('should handle chart scroll without errors', () => {
//     const event = { target: { scrollLeft: 5, scrollTop: 5 } } as any;
//     expect(() => component.onChartScroll(event)).not.toThrow();
//   });

//   // ---------- BAR RESIZE ----------
//   it('should handle bar resize start correctly', () => {
//     const row = { id: '1', startDate: new Date(), endDate: new Date() } as any;
//     const event = { preventDefault: () => {} } as any;
//     expect(() => component.onBarResizeStart(event, row, 'left')).not.toThrow();
//   });
// });
