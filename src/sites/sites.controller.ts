import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { SearchSiteDto } from './dto/search-site.dto.js';
import { SitesService } from './sites.service.js';

@ApiTags('sites')
@ApiBearerAuth()
@Controller('sites')
@UseGuards(AuthGuard)
export class SitesController {
  constructor(private readonly service: SitesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Buscar una URL y comprobar si ya fue reportada' })
  search(@Query() query: SearchSiteDto) {
    return this.service.buscar(query.url!);
  }
}