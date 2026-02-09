import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from '../auth/dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.userModel.findOne({ email }).select('+password').exec() as Promise<
      User | undefined
    >;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.userModel.findById(id).exec() as Promise<User | undefined>;
  }

  async addPoints(userId: string, points: number) {
    return this.userModel.findByIdAndUpdate(userId, { $inc: { points: points } }, { new: true });
  }

  async getTopPlayers(limit: number = 100) {
    return this.userModel
      .find({}, { nickname: 1, avatar: 1, points: 1 })
      .sort({ points: -1 })
      .limit(limit);
  }
}
