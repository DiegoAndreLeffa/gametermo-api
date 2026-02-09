import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  nickname: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: 'default_avatar.png' })
  avatar: string;

  @Prop({ default: 0 })
  points: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
// No final do arquivo user.schema.ts
UserSchema.index({ points: -1 });
