import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageNamespace, StorageService } from '../storage/storage.service';
import { ScenesController } from './scenes.controller';

describe('ScenesController', () => {
  let controller: ScenesController;
  let storage: { get: jest.Mock; set: jest.Mock; has: jest.Mock };

  beforeEach(async () => {
    storage = { get: jest.fn(), set: jest.fn(), has: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScenesController],
      providers: [{ provide: StorageService, useValue: storage }],
    }).compile();

    controller = module.get<ScenesController>(ScenesController);
  });

  it('ends the response with the stored buffer', async () => {
    const payload = Buffer.from([7, 8, 9]);
    storage.get.mockResolvedValue(payload);
    const res = { end: jest.fn() };

    await controller.findOne({ id: 'scene-1' }, res as any);

    expect(storage.get).toHaveBeenCalledWith(
      'scene-1',
      StorageNamespace.SCENES,
    );
    expect(res.end).toHaveBeenCalledWith(payload);
  });

  it('throws NotFoundException for missing scenes', async () => {
    storage.get.mockResolvedValue(undefined);

    await expect(
      controller.findOne({ id: 'missing' }, { end: jest.fn() } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores the payload and returns a numeric id', async () => {
    const payload = Buffer.from('scene');
    storage.get.mockResolvedValue(undefined);
    storage.set.mockResolvedValue(true);

    const result = await controller.create(payload);

    expect(result.id).toMatch(/^\d{16}$/);
    expect(storage.set).toHaveBeenCalledWith(
      result.id,
      payload,
      StorageNamespace.SCENES,
    );
  });
});
