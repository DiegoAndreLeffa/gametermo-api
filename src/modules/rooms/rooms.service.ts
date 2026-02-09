/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room } from './schemas/room.schema';
import { Theme } from '../content/schemas/theme.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(Theme.name) private themeModel: Model<Theme>,
  ) {}

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  async createRoom(userId: string, themeSlug: string, name: string) {
    const theme = await this.themeModel.findOne({ slug: themeSlug }).exec();
    if (!theme) throw new NotFoundException('Theme not found');

    let code = this.generateCode();
    while (await this.roomModel.findOne({ code }).exec()) {
      code = this.generateCode();
    }

    const room = await this.roomModel.create({
      code,
      name,
      owner: userId,
      members: [userId],
      theme: theme._id,
    } as any);

    return room;
  }

  async joinRoom(userId: string, code: string) {
    const room = await this.roomModel.findOne({ code }).exec();
    if (!room) throw new NotFoundException('Room not found');

    const members = room.members as any[];
    const isMember = members.some((m: any) => m.toString() === userId);

    if (!isMember) {
      room.members.push(userId as any);
      await room.save();
    }

    return room;
  }

  async getRoomDetails(roomId: string) {
    return this.roomModel
      .findById(roomId)
      .populate('members', 'nickname avatar')
      .populate('owner', 'nickname')
      .exec();
  }

  async getRoomById(roomId: string) {
    return this.roomModel.findById(roomId).exec();
  }
}
