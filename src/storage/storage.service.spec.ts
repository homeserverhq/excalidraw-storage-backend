import { StorageNamespace, StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    // Force Keyv's in-memory adapter for the test run.
    delete process.env.STORAGE_URI;
    service = new StorageService();
  });

  it('round-trips binary payloads', async () => {
    const payload = Buffer.from([0, 1, 2, 3, 255, 254]);
    await service.set('key', payload, StorageNamespace.ROOMS);

    const stored = await service.get('key', StorageNamespace.ROOMS);

    expect(Buffer.isBuffer(stored)).toBe(true);
    expect([...stored]).toEqual([...payload]);
  });

  it('returns undefined for missing keys', async () => {
    expect(
      await service.get('missing', StorageNamespace.ROOMS),
    ).toBeUndefined();
  });

  it('coerces string values to bytes instead of throwing', async () => {
    await service.set(
      'string',
      'hello' as unknown as Buffer,
      StorageNamespace.ROOMS,
    );

    const stored = await service.get('string', StorageNamespace.ROOMS);

    expect(stored?.toString()).toBe('hello');
  });

  it('coerces legacy object values to JSON bytes instead of throwing', async () => {
    const legacy = { elements: [], appState: {}, version: 1 };
    await service.set(
      'object',
      legacy as unknown as Buffer,
      StorageNamespace.SCENES,
    );

    const stored = await service.get('object', StorageNamespace.SCENES);

    expect(Buffer.isBuffer(stored)).toBe(true);
    expect(JSON.parse(stored.toString())).toEqual(legacy);
  });

  it('reports key presence with has()', async () => {
    await service.set('present', Buffer.from('x'), StorageNamespace.ROOMS);

    expect(await service.has('present', StorageNamespace.ROOMS)).toBe(true);
    expect(await service.has('absent', StorageNamespace.ROOMS)).toBe(false);
  });
});
