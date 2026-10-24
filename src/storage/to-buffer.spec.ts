import { toBuffer } from './to-buffer';

describe('toBuffer', () => {
  it('returns undefined for nullish values', () => {
    expect(toBuffer(undefined)).toBeUndefined();
    expect(toBuffer(null)).toBeUndefined();
  });

  it('passes Buffers through unchanged', () => {
    const buffer = Buffer.from([1, 2, 3]);
    expect(toBuffer(buffer)).toBe(buffer);
  });

  it('converts Uint8Array values', () => {
    expect([...toBuffer(new Uint8Array([4, 5, 6]))]).toEqual([4, 5, 6]);
  });

  it('converts string values', () => {
    expect(toBuffer('hello')?.toString()).toBe('hello');
  });

  it('serializes plain objects to JSON bytes', () => {
    expect(toBuffer({ elements: [], version: 1 })?.toString()).toBe(
      '{"elements":[],"version":1}',
    );
  });
});
