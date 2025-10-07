import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CardType, IssueSummaryCard } from './issue-summary-card';

describe('IssueSummaryCard', () => {
  let component: IssueSummaryCard;
  let fixture: ComponentFixture<IssueSummaryCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueSummaryCard],
    }).compileComponents();

    fixture = TestBed.createComponent(IssueSummaryCard);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Initial data binding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test case for default inputs
  it('should display default values if no inputs are provided', () => {
    // Check component properties for defaults
    expect(component.type).toBe('completed');
    expect(component.count).toBe(0);
    expect(component.label).toBe('');
    expect(component.timePeriod).toBe('in the last 7 days');

    // Check rendered content for defaults
    const countElement = fixture.debugElement.query(By.css('.card-count')).nativeElement;
    expect(countElement.textContent).toContain('0');
    const labelElement = fixture.debugElement.query(By.css('.card-label')).nativeElement;
    expect(labelElement.textContent).toBe('');
    const timeElement = fixture.debugElement.query(By.css('.card-time')).nativeElement;
    expect(timeElement.textContent).toContain('in the last 7 days');

    // Check icon color for default type 'completed'
    const iconElement = fixture.debugElement.query(By.css('.card-icon')).nativeElement;
    expect(iconElement.style.color).toBe('rgb(16, 185, 129)'); // Corresponds to #10b981
  });

  // Test case for custom inputs
  it('should correctly display custom input values', () => {
    component.type = 'created';
    component.count = 42;
    component.label = 'New Issues';
    component.timePeriod = 'today';
    fixture.detectChanges();

    const countElement = fixture.debugElement.query(By.css('.card-count')).nativeElement;
    expect(countElement.textContent).toContain('42');
    const labelElement = fixture.debugElement.query(By.css('.card-label')).nativeElement;
    expect(labelElement.textContent).toBe('New Issues');
    const timeElement = fixture.debugElement.query(By.css('.card-time')).nativeElement;
    expect(timeElement.textContent).toContain('today');
  });

  // Test cases for getIconColor and icon rendering based on 'type' input
  const cardTypes: CardType[] = ['completed', 'updated', 'created', 'due-soon'];
  const expectedColors: Record<CardType, string> = {
    completed: 'rgb(16, 185, 129)', // #10b981
    updated: 'rgb(107, 114, 128)', // #6b7280
    created: 'rgb(245, 158, 11)', // #f59e0b
    'due-soon': 'rgb(239, 68, 68)', // #ef4444
  };

  cardTypes.forEach((cardType: CardType) => {
    it(`should set correct color and display the correct icon for type: ${cardType}`, () => {
      component.type = cardType;
      fixture.detectChanges();

      const iconElement = fixture.debugElement.query(By.css('.card-icon')).nativeElement;
      // Check the color applied via [style.color]="getIconColor()"
      expect(iconElement.style.color).toBe(expectedColors[cardType]);

      // Check that only one SVG icon (the correct one) is rendered
      const allSvgs = fixture.debugElement.queryAll(By.css('svg'));
      expect(allSvgs.length).toBe(1);

      // A simple check to ensure the correct SVG is present.
      // In the HTML, SVGs are conditionally rendered with *ngIf="type === '...'"
      const correctSvg = fixture.debugElement.query(By.css(`svg[ng-reflect-ng-if="${cardType}"]`));
      expect(correctSvg).toBeTruthy(`Expected SVG for type ${cardType} to be present`);
    });
  });
});
