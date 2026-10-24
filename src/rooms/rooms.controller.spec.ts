import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageNamespace, StorageService } from '../storage/storage.service';
import { RoomsController } from './rooms.controller';

describe('RoomsController', () => {
  let controller: RoomsController;
  let storage: { get: jest.Mock; set: jest.Mock; has: jest.Mock };

  beforeEach(async () => {
    storage = { get: jest.fn(), set: jest.fn(), has: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [{ provide: StorageService, useValue: storage }],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  it('ends the response with the stored buffer', async () => {
    const payload = Buffer.from([1, 2, 3]);
    storage.get.mockResolvedValue(payload);
    const res = { end: jest.fn() };

    await controller.findOne({ id: 'room-1' }, res as any);

    expect(storage.get).toHaveBeenCalledWith('room-1', StorageNamespace.ROOMS);
    expect(res.end).toHaveBeenCalledWith(payload);
  });

  it('throws NotFoundException for missing rooms', async () => {
    storage.get.mockResolvedValue(undefined);

    await expect(
      controller.findOne({ id: 'missing' }, { end: jest.fn() } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores the payload on create', async () => {
    const payload = Buffer.from('data');
    storage.set.mockResolvedValue(true);

    await expect(controller.create({ id: 'room-2' }, payload)).resolves.toEqual(
      { id: 'room-2' },
    );
    expect(storage.set).toHaveBeenCalledWith(
      'room-2',
      payload,
      StorageNamespace.ROOMS,
    );
  });
});
