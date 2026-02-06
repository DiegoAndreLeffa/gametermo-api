// src/modules/content/schemas/theme.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ThemeDocument = HydratedDocument<Theme>;

@Schema({ timestamps: true })
export class Theme {
  @Prop({ required: true, unique: true })
  slug: string; // ex: 'lol', 'valorant', 'pokemon'

  @Prop({ required: true })
  name: string; // ex: 'League of Legends'

  @Prop({ required: true })
  type: 'CLASSIC' | 'ATTRIBUTES'; // CLASSIC = Termo (letras), ATTRIBUTES = Loldle (comparação)

  // Aqui definimos quais colunas existem nesse jogo
  // Ex: ['Gender', 'Range Type', 'Region', 'Resource']
  @Prop({ type: [String], default: [] })
  attributeKeys: string[];
}

export const ThemeSchema = SchemaFactory.createForClass(Theme);
