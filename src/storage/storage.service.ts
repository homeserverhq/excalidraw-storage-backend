import { Injectable, Logger } from '@nestjs/common';
import * as Keyv from 'keyv';
import { toBuffer } from './to-buffer';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  storagesMap = new Map<string, Keyv>();

  constructor() {
    const uri = process.env[`STORAGE_URI`];
    if (!uri) {
      this.logger.warn(
        `STORAGE_URI is undefined, will use non persistant in memory storage`,
      );
    }

    Object.keys(StorageNamespace).forEach((namespace) => {
      const keyv = new Keyv({
        uri,
        namespace,
      });
      keyv.on('error', (err) =>
        this.logger.error(`Connection Error for namespace ${namespace}`, err),
      );
      this.storagesMap.set(namespace, keyv);
    });
  }

  async get(
    key: string,
    namespace: StorageNamespace,
  ): Promise<Buffer | undefined> {
    const value = await this.storagesMap.get(namespace).get(key);

    if (value === undefined || value === null) {
      return undefined;
    }

    // Values written by this service are Buffers. Anything else (e.g. legacy
    // JSON records) must not reach the response as a non-binary value, which
    // previously threw inside a Readable stream and crashed the process.
    if (
      typeof value === 'object' &&
      !Buffer.isBuffer(value) &&
      !(value instanceof Uint8Array)
    ) {
      this.logger.warn(
        `Stored value for ${namespace}/${key} is not binary; coercing to JSON bytes`,
      );
    }

    return toBuffer(value);
  }

  async has(key: string, namespace: StorageNamespace): Promise<boolean> {
    return !!(await this.get(key, namespace));
  }

  set(key: string, value: Buffer, namespace: StorageNamespace): Promise<true> {
    return this.storagesMap.get(namespace).set(key, value);
  }
}

export enum StorageNamespace {
  SCENES = 'SCENES',
  ROOMS = 'ROOMS',
  FILES = 'FILES',
}
