import { AvatarClassPipe, InitialsPipe } from './avatar.pipe';

describe('AvatarClassPipe', () => {
  let pipe: AvatarClassPipe;

  beforeEach(() => {
    pipe = new AvatarClassPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return default gray color for undefined', () => {
    expect(pipe.transform(undefined)).toBe('#94A3B8');
  });

  it('should return default gray color for empty string', () => {
    expect(pipe.transform('')).toBe('#94A3B8');
  });

  it('should return consistent color for same name', () => {
    const result1 = pipe.transform('John Doe');
    const result2 = pipe.transform('John Doe');
    expect(result1).toBe(result2);
  });

  it('should return hex color code (shade of primary #3D62A8)', () => {
    const validColors = [
      '#5A7FBF', '#4A6FB5', '#3D62A8', '#36579A',
      '#2F4D8C', '#28437E', '#658AC5', '#4E69AC'
    ];
    const result = pipe.transform('Alice Smith');
    expect(validColors).toContain(result);
  });

  it('should return a hex color string starting with #', () => {
    const result = pipe.transform('Test User');
    expect(result).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should handle different names consistently', () => {
    const name1 = pipe.transform('Alice');
    const name2 = pipe.transform('Bob');
    const name3 = pipe.transform('Charlie');
    
    // All should be valid hex colors
    expect(name1).toMatch(/^#[0-9A-F]{6}$/i);
    expect(name2).toMatch(/^#[0-9A-F]{6}$/i);
    expect(name3).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('InitialsPipe', () => {
  let pipe: InitialsPipe;

  beforeEach(() => {
    pipe = new InitialsPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return "?" for undefined name', () => {
    expect(pipe.transform(undefined)).toBe('?');
  });

  it('should return "?" for empty string', () => {
    expect(pipe.transform('')).toBe('?');
  });

  it('should return single initial for single name', () => {
    expect(pipe.transform('Alice')).toBe('A');
  });

  it('should return two initials for two names', () => {
    expect(pipe.transform('John Doe')).toBe('JD');
  });

  it('should return only first two initials for multiple names', () => {
    expect(pipe.transform('Mary Jane Watson Smith')).toBe('MJ');
  });

  it('should handle names with extra spaces', () => {
    expect(pipe.transform('  John   Doe  ')).toBe('JD');
  });

  it('should uppercase the initials', () => {
    expect(pipe.transform('alice bob')).toBe('AB');
  });

  it('should handle single character names', () => {
    expect(pipe.transform('A B')).toBe('AB');
  });

  it('should handle names with special characters', () => {
    expect(pipe.transform('Jean-Pierre Marie')).toBe('JM');
  });

  it('should handle names with numbers', () => {
    expect(pipe.transform('John2 Doe3')).toBe('JD');
  });
});
