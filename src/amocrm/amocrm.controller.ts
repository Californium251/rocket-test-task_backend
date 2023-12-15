import { Controller, Get, Query } from '@nestjs/common';
import { AmocrmService } from './amocrm.service';

@Controller('amocrm')
export class AmocrmController {
  constructor(private readonly amocrmService: AmocrmService) {}

  @Get()
  async getAmoCRMData(@Query() query: any): Promise<any> {
    return this.amocrmService.getAmoData(query);
  }
}
