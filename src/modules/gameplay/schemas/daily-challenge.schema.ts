import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Theme } from '../../content/schemas/theme.schema';
import { Entity } from '../../content/schemas/entity.schema';

export type DailyChallengeDocument = HydratedDocument<DailyChallenge>;

@Schema({ timestamps: true })
export class DailyChallenge {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Theme', required: true })
  theme: Theme;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Entity', required: true })
  entity: Entity;

  @Prop({ required: true })
  date: string;
}

export const DailyChallengeSchema = SchemaFactory.createForClass(DailyChallenge);
DailyChallengeSchema.index({ theme: 1, date: 1 }, { unique: true });
