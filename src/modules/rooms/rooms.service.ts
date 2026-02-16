/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const existingRoom = await this.roomModel.findOne({
      owner: new Types.ObjectId(userId) as any,
    });

    if (existingRoom) {
      throw new BadRequestException(
        `Você já possui uma sala ativa (${existingRoom.code}). Desfaça-a antes de criar outra.`,
      );
    }

    const theme = await this.themeModel.findOne({ slug: themeSlug });
    if (!theme) throw new NotFoundException('Theme not found');

    let code = this.generateCode();
    while (await this.roomModel.findOne({ code })) {
      code = this.generateCode();
    }

    const room = await this.roomModel.create({
      code,
      name,
      owner: new Types.ObjectId(userId) as any,
      members: [new Types.ObjectId(userId) as any],
      theme: theme._id as any,
    });

    return room;
  }

  async deleteRoom(userId: string, roomId: string) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    if (room.owner.toString() !== userId) {
      throw new ForbiddenException('Apenas o dono pode desfazer a sala');
    }

    await this.roomModel.findByIdAndDelete(roomId);
    return { message: 'Room deleted successfully' };
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

  async getUserRooms(userId: string) {
    return this.roomModel
      .find({ members: userId } as any)
      .select('name code owner members theme')
      .populate('owner', 'nickname')
      .sort({ createdAt: -1 });
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
