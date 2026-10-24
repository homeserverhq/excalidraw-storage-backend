import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import {
  StorageNamespace,
  StorageService,
} from './../src/storage/storage.service';

const BINARY = Buffer.from([0, 1, 2, 3, 255, 254]);

const getBinary = (app: INestApplication, path: string) =>
  request(app.getHttpServer())
    .get(path)
    .buffer(true)
    .parse((res, callback) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => callback(null, Buffer.concat(chunks)));
    });

describe('storage backend (e2e)', () => {
  let app: INestApplication;
  let storage: StorageService;

  beforeAll(async () => {
    // Force the in-memory Keyv adapter for the test run.
    delete process.env.STORAGE_URI;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v2');
    await app.init();

    storage = app.get(StorageService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('round-trips a room as binary', async () => {
    await request(app.getHttpServer())
      .put('/api/v2/rooms/e2e-room')
      .set('Content-Type', 'application/octet-stream')
      .send(BINARY)
      .expect(200);

    const response = await getBinary(app, '/api/v2/rooms/e2e-room').expect(200);

    expect(response.body).toEqual(BINARY);
  });

  it('round-trips a file as binary', async () => {
    await request(app.getHttpServer())
      .put('/api/v2/files/e2e-file')
      .set('Content-Type', 'application/octet-stream')
      .send(BINARY)
      .expect(200);

    const response = await getBinary(app, '/api/v2/files/e2e-file').expect(200);

    expect(response.body).toEqual(BINARY);
  });

  it('creates and fetches a scene', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v2/scenes')
      .set('Content-Type', 'application/octet-stream')
      .send(BINARY)
      .expect(201);

    const response = await getBinary(
      app,
      `/api/v2/scenes/${created.body.id}`,
    ).expect(200);

    expect(response.body).toEqual(BINARY);
  });

  it('serves legacy non-binary values as JSON bytes without crashing', async () => {
    const legacy = { elements: [], appState: {}, version: 1 };
    await storage.set(
      'legacy',
      legacy as unknown as Buffer,
      StorageNamespace.ROOMS,
    );

    const response = await getBinary(app, '/api/v2/rooms/legacy').expect(200);

    expect(JSON.parse((response.body as Buffer).toString())).toEqual(legacy);

    // the server is still alive and serving after the coercion
    await getBinary(app, '/api/v2/rooms/e2e-room').expect(200);
  });

  it('returns 404 for missing records', async () => {
    await request(app.getHttpServer())
      .get('/api/v2/rooms/does-not-exist')
      .expect(404);
  });
});
