import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AddColumnButton } from './add-column-button';
import { BoardStore } from '../../board-store';

class StoreMock {
  columns = signal<any[]>([]);
  addColumn = jasmine.createSpy('addColumn');
}

describe('AddColumnButton', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddColumnButton],
      providers: [{ provide: BoardStore, useClass: StoreMock }]
    }).compileComponents();
  });

  it('open/close toggles isOpen and clears name', () => {
    const f = TestBed.createComponent(AddColumnButton);
    const c = f.componentInstance;
    c.name = 'X';
    c.open();
    expect(c.isOpen).toBeTrue();
    c.close();
    expect(c.isOpen).toBeFalse();
    expect(c.name).toBe('');
  });

  it('addColumn ignores blank names', () => {
    const f = TestBed.createComponent(AddColumnButton);
    const c = f.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;
    c.name = '   ';
    c.addColumn();
    expect(store.addColumn).not.toHaveBeenCalled();
  });

  it('addColumn adds and closes for valid names', () => {
    const f = TestBed.createComponent(AddColumnButton);
    const c = f.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    c.name = 'QA Ready';
    c.color = 'border-slate-300';
    c.isOpen = true;
    c.addColumn();

    expect(store.addColumn).toHaveBeenCalledWith({ id:'QA_READY', title:'QA Ready', color:'border-slate-300' });
    expect(c.isOpen).toBeFalse();
    expect(c.name).toBe('');
  });
});
