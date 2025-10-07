import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartHeader } from './chart-header';

describe('ChartHeader', () => {
  let component: ChartHeader;
  let fixture: ComponentFixture<ChartHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit back event when onBack is called', () => {
    spyOn(component.back, 'emit');
    component.onBack();
    expect(component.back.emit).toHaveBeenCalled();
  });
});
