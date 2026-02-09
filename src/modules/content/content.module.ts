import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { Theme, ThemeSchema } from './schemas/theme.schema';
import { Entity, EntitySchema } from './schemas/entity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Theme.name, schema: ThemeSchema },
      { name: Entity.name, schema: EntitySchema },
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService], // Exportamos pois outros módulos vão precisar buscar entidades
})
export class ContentModule {}
