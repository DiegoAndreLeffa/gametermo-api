import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Theme } from '../../content/schemas/theme.schema';

export type RoomDocument = HydratedDocument<Room>;

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  owner: User;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  members: User[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Theme', required: true })
  theme: Theme;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Entity' })
  currentDailyEntity: Types.ObjectId;

  @Prop()
  currentDailyDate: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
