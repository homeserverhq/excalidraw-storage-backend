import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageNamespace, StorageService } from '../storage/storage.service';
import { FilesController } from './files.controller';

describe('FilesController', () => {
  let controller: FilesController;
  let storage: { get: jest.Mock; set: jest.Mock; has: jest.Mock };

  beforeEach(async () => {
    storage = { get: jest.fn(), set: jest.fn(), has: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: StorageService, useValue: storage }],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('ends the response with the stored buffer', async () => {
    const payload = Buffer.from([4, 5, 6]);
    storage.get.mockResolvedValue(payload);
    const res = { end: jest.fn() };

    await controller.findOne({ id: 'file-1' }, res as any);

    expect(storage.get).toHaveBeenCalledWith('file-1', StorageNamespace.FILES);
    expect(res.end).toHaveBeenCalledWith(payload);
  });

  it('throws NotFoundException for missing files', async () => {
    storage.get.mockResolvedValue(undefined);

    await expect(
      controller.findOne({ id: 'missing' }, { end: jest.fn() } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores the payload on create', async () => {
    const payload = Buffer.from('image');
    storage.set.mockResolvedValue(true);

    await expect(controller.create({ id: 'file-2' }, payload)).resolves.toEqual(
      { id: 'file-2' },
    );
    expect(storage.set).toHaveBeenCalledWith(
      'file-2',
      payload,
      StorageNamespace.FILES,
    );
  });
});
