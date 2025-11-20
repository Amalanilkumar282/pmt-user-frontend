import { DEFAULT_COLUMNS, statusOrder, fuzzyIncludes } from './utils';

describe('utils', () => {
  it('DEFAULT_COLUMNS shape and stable ids', () => {
    const ids = DEFAULT_COLUMNS.map(c => c.id);
    expect(ids).toEqual(['TODO','IN_PROGRESS','BLOCKED','IN_REVIEW','DONE']);
  });

  it('statusOrder progresses TODO -> DONE', () => {
    expect(statusOrder['TO_DO']).toBeLessThan(statusOrder['DONE']);
    expect(statusOrder['IN_PROGRESS']).toBeGreaterThan(statusOrder['TODO']);
  });

  it('fuzzyIncludes is case-insensitive and trims', () => {
    expect(fuzzyIncludes('Hello World', '  world')).toBeTrue();
    expect(fuzzyIncludes('Hello', 'XYZ')).toBeFalse();
  });
});
