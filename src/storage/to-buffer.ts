/**
 * Coerce a value read from the key/value store into raw bytes.
 *
 * Values written by this service are `Buffer`s and round-trip unchanged.
 * Foreign or legacy values (strings, plain objects) are converted as well so
 * that a single malformed record can never crash a request handler.
 */
export function toBuffer(value: unknown): Buffer | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }

  if (typeof value === 'string') {
    return Buffer.from(value);
  }

  return Buffer.from(JSON.stringify(value));
}
