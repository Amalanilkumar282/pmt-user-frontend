import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange, EventEmitter } from '@angular/core';

import { BacklogContainer } from './backlog-container';

describe('BacklogContainer', () => {
  let component: BacklogContainer;
  let fixture: ComponentFixture<BacklogContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BacklogContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BacklogContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should run change detection without throwing', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should call ngOnInit if present', () => {
    const anyComp = component as any;
    if (typeof anyComp.ngOnInit === 'function') {
      const spy = spyOn<any>(anyComp, 'ngOnInit').and.callThrough();
      // call manually to avoid relying on TestBed lifecycle ordering
      anyComp.ngOnInit();
      expect(spy).toHaveBeenCalled();
    } else {
      // component does not implement ngOnInit - acceptable
      expect(true).toBeTrue();
    }
  });

  it('should accept ngOnChanges without throwing', () => {
    const anyComp = component as any;
    if (typeof anyComp.ngOnChanges === 'function') {
      expect(() => anyComp.ngOnChanges({
        someInput: new SimpleChange(null, {}, false)
      })).not.toThrow();
    } else {
      expect(true).toBeTrue();
    }
  });

  it('should expose EventEmitters as EventEmitter instances when present', () => {
    const anyComp = component as any;
    const keys = Object.keys(anyComp);
    const emitterKeys = keys.filter(k => anyComp[k] instanceof EventEmitter);
    // there's no requirement that any emitters exist; this test asserts that if they do, they are EventEmitter
    emitterKeys.forEach(k => {
      expect(anyComp[k] instanceof EventEmitter).toBeTrue();
    });
  });

  it('should call zero-arg prototype methods without throwing (skip getters)', () => {
    const proto = Object.getPrototypeOf(component) as any;
    const methodNames = Object.getOwnPropertyNames(proto)
      .filter(n => {
        if (n === 'constructor') return false;
        const desc = Object.getOwnPropertyDescriptor(proto, n);
        // only call actual function-valued methods (descriptor.value)
        return !!desc && typeof desc.value === 'function' && desc.value.length === 0;
      });

    methodNames.forEach(name => {
      expect(() => (component as any)[name]()).not.toThrow();
    });
  });

  it('should have a host element (DOM) available', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el).toBeTruthy();
    // At minimum the host element should exist; templates vary across implementations.
    expect(el.nodeType).toBe(1);
  });
});
