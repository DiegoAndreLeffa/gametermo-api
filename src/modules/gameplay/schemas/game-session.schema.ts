import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Theme } from '../../content/schemas/theme.schema';
import { Entity } from '../../content/schemas/entity.schema';

export type GameSessionDocument = HydratedDocument<GameSession>;

@Schema({ timestamps: true })
export class GameSession {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Theme', required: true })
  theme: Theme;

  @Prop({ enum: ['DAILY', 'INFINITE'], required: true })
  mode: string;

  @Prop()
  dailyDate?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Entity', required: true })
  targetEntity: Entity;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Entity' }], default: [] })
  guesses: Entity[];

  @Prop({ enum: ['PLAYING', 'WON', 'LOST'], default: 'PLAYING' })
  status: string;

  @Prop({ default: 0 })
  attempts: number;
}

export const GameSessionSchema = SchemaFactory.createForClass(GameSession);

GameSessionSchema.index(
  { user: 1, theme: 1, mode: 1, dailyDate: 1 },
  { unique: true, partialFilterExpression: { mode: 'DAILY' } },
);
