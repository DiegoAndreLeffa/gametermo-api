import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { CreateEntityDto } from './dto/create-entity.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('themes')
  @ApiOperation({ summary: 'Cria um novo tema de jogo (ex: LoL, Valorant)' })
  createTheme(@Body() dto: CreateThemeDto) {
    return this.contentService.createTheme(dto);
  }

  @Get('themes')
  @ApiOperation({ summary: 'Lista todos os temas disponíveis' })
  getThemes() {
    return this.contentService.getThemes();
  }

  @Post('entities')
  @ApiOperation({ summary: 'Cria uma nova entidade (campeão, item, etc) para um tema' })
  createEntity(@Body() dto: CreateEntityDto) {
    return this.contentService.createEntity(dto);
  }

  @Get(':themeSlug/entities')
  @ApiOperation({ summary: 'Lista todas as entidades de um tema específico' })
  getEntities(@Param('themeSlug') themeSlug: string) {
    return this.contentService.getEntitiesByTheme(themeSlug);
  }
}
