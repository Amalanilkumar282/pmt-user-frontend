import { AvatarClassPipe, InitialsPipe } from './avatar.pipe';

describe('AvatarClassPipe', () => {
  let pipe: AvatarClassPipe;

  beforeEach(() => {
    pipe = new AvatarClassPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return default gray class for undefined', () => {
    expect(pipe.transform(undefined)).toBe('bg-gray-400');
  });

  it('should return default gray class for empty string', () => {
    expect(pipe.transform('')).toBe('bg-gray-400');
  });

  it('should return consistent color for same name', () => {
    const result1 = pipe.transform('John Doe');
    const result2 = pipe.transform('John Doe');
    expect(result1).toBe(result2);
  });

  it('should return one of the predefined colors', () => {
    const validColors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
      'bg-pink-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const result = pipe.transform('Alice Smith');
    expect(validColors).toContain(result);
  });

  it('should handle different names differently (most of the time)', () => {
    const name1 = pipe.transform('Alice');
    const name2 = pipe.transform('Bob');
    const name3 = pipe.transform('Charlie');
    
    // At least one should be different (statistically very likely with 8 colors and 3 names)
    const allSame = name1 === name2 && name2 === name3;
    expect(allSame).toBe(false);
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
