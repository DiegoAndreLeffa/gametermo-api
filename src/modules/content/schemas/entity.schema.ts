// src/modules/content/schemas/entity.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type EntityDocument = HydratedDocument<Entity>;

@Schema({ timestamps: true })
export class Entity {
  @Prop({ required: true })
  name: string; // ex: 'Ahri'

  @Prop()
  imageUrl: string; // ex: 'ahri_splash.jpg'

  // Relacionamento com o Tema
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Theme', required: true })
  theme: Types.ObjectId;

  // O "Segredo" da flexibilidade.
  // Um objeto Map onde a chave é o atributo e o valor é o dado.
  // Ex: { "Gender": "Female", "Range Type": "Ranged" }
  @Prop({ type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Mixed })
  attributes: Record<string, any>;
}

// Índice composto: Não pode ter dois "Ahri" no tema "LoL"
export const EntitySchema = SchemaFactory.createForClass(Entity);
EntitySchema.index({ name: 1, theme: 1 }, { unique: true });
