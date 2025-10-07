import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartTable } from './chart-table';

describe('ChartTable', () => {
  let component: ChartTable;
  let fixture: ComponentFixture<ChartTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
