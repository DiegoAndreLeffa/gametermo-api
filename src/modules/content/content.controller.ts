import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { CreateEntityDto } from './dto/create-entity.dto';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('themes')
  createTheme(@Body() dto: CreateThemeDto) {
    return this.contentService.createTheme(dto);
  }

  @Get('themes')
  getThemes() {
    return this.contentService.getThemes();
  }

  @Post('entities')
  createEntity(@Body() dto: CreateEntityDto) {
    return this.contentService.createEntity(dto);
  }

  @Get(':themeSlug/entities')
  getEntities(@Param('themeSlug') themeSlug: string) {
    return this.contentService.getEntitiesByTheme(themeSlug);
  }
}
